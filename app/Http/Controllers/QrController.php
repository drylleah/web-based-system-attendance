<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\QrRegistration;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * QrController
 *
 * Manages QR-based attendance registration.
 *
 * Design decisions
 * ────────────────
 * • The QR token is a UUID v4 stored in the database.  The actual QR
 *   image is rendered entirely in the browser (QRCode.js) — no server-
 *   side image generation is needed, which keeps the backend free of
 *   additional dependencies.
 *
 * • Registration is PUBLIC (no login required) so students/staff can
 *   register themselves at a kiosk-style screen.  Admin-only actions
 *   (list, regenerate, delete) are guarded by auth.session.
 *
 * Routes (defined in routes/api.php):
 *   PUBLIC:
 *     POST   /api/qr/register            — register and get a QR token
 *     GET    /api/qr/token/{school_id}   — fetch token for a known ID (for re-download)
 *
 *   PROTECTED (auth.session):
 *     GET    /api/qr/cards               — list all QR-registered users
 *     POST   /api/qr/regenerate          — issue a new token (admin action)
 *     DELETE /api/qr/cards/{school_id}   — remove a registration
 */
class QrController extends Controller
{
    // ---------------------------------------------------------------
    // Private helper: normalise()
    //
    // Keeps school IDs consistent across storage and lookup:
    // trimmed, uppercased, internal whitespace collapsed.
    // Mirrors the same helper in RfidController.
    // ---------------------------------------------------------------
    private function normalise(mixed $value): string
    {
        return strtoupper(preg_replace('/\s+/', '', trim((string) $value)));
    }

    // ---------------------------------------------------------------
    // POST /api/qr/scan  — PUBLIC
    //
    // Core QR kiosk logic — called every time the webcam decodes a QR.
    // Mirrors RfidController::scan() exactly — same attendance table,
    // same time-in / time-out logic, same response shape — so the
    // frontend can feed the result directly into the existing
    // showSuccessPanel() / showErrorPanel() functions.
    //
    // The only difference from RFID: identity is resolved via
    // qr_registrations.qr_token instead of rfid_cards.id_number.
    //
    // Flow:
    //   1. Validate the incoming qr_token.
    //   2. Look up the student in qr_registrations.
    //      - Not found → 404 "not registered"
    //   3. Check for an open attendance record for today
    //      (time_out = null).
    //      - Open record found  → record time_out (Time Out)
    //      - No open record     → create new row with time_in (Time In)
    //   4. Return the same shape as RfidController::scan() so the
    //      kiosk UI needs zero changes.
    // ---------------------------------------------------------------
    public function scan(Request $request): JsonResponse
    {
        $token = trim($request->input('qr_token', ''));

        if (! $token) {
            return response()->json(['error' => 'qr_token is required.'], 400);
        }

        // Resolve student identity from the QR token
        $reg = QrRegistration::where('qr_token', $token)->first();

        if (! $reg) {
            return response()->json([
                'error'     => 'QR code not registered. Please register for QR attendance.',
                'qr_token'  => $token,
            ], 404);
        }

        // Use the school_id as the attendance identifier — same column
        // used by RFID (id_number), keeping both methods in one table
        $idNumber = $reg->school_id;
        $todayStr = now()->toDateString();

        // Check for an open (time_out = null) attendance record today
        $openRecord = Attendance::where('id_number', $idNumber)
                                ->whereDate('date', $todayStr)
                                ->whereNull('time_out')
                                ->orderByDesc('time_in')
                                ->first();

        if ($openRecord) {
            // ---- TIME OUT ----
            $timeOutDatetime = now()->format('Y-m-d H:i:s');
            $openRecord->update(['time_out' => $timeOutDatetime]);

            $action       = 'time_out';
            $attendanceId = $openRecord->id;
        } else {
            // ---- TIME IN ----
            $newRecord = Attendance::create([
                'id_number'      => $idNumber,
                'last_name'      => $reg->last_name,
                'first_name'     => $reg->first_name,
                'middle_initial' => $reg->middle_initial,
                'time_in'        => now()->format('Y-m-d H:i:s'),
                'time_out'       => null,
                'date'           => $todayStr,
                'remarks'        => 'QR scan',
            ]);

            $action       = 'time_in';
            $attendanceId = $newRecord->id;
        }

        // Build display name — matches RfidController::scan() format
        $mi       = $reg->middle_initial ? ' ' . $reg->middle_initial . '.' : '';
        $fullName = "{$reg->first_name}{$mi} {$reg->last_name}";

        // Return the exact same shape as /api/rfid/scan so showSuccessPanel()
        // in attendance.js can consume this response without any changes
        return response()->json([
            'success'        => true,
            'action'         => $action,
            'attendance_id'  => $attendanceId,
            'id_number'      => $idNumber,
            'last_name'      => $reg->last_name,
            'first_name'     => $reg->first_name,
            'middle_initial' => $reg->middle_initial,
            'full_name'      => $fullName,
            'time'           => now()->format('h:i A'),
            'date'           => $todayStr,
        ]);
    }

    // ---------------------------------------------------------------
    // POST /api/qr/register  — PUBLIC
    //
    // Registers a new student/staff member and issues a QR token.
    //
    // Flow:
    //   1. Validate & normalise the school_id.
    //   2. Reject if a registration already exists (409).
    //   3. Create the row with a fresh UUID as qr_token.
    //   4. Return the token so the client can render the QR image.
    // ---------------------------------------------------------------
    public function register(Request $request): JsonResponse
    {
        // ---- Input normalisation ----
        $schoolId      = $this->normalise($request->input('school_id', ''));
        $lastName      = trim($request->input('last_name',  ''));
        $firstName     = trim($request->input('first_name', ''));
        $middleInitial = trim($request->input('middle_initial', ''));

        // ---- Basic validation ----
        $errors = [];
        if (! $schoolId)  $errors['school_id']  = 'School ID is required.';
        if (! $lastName)  $errors['last_name']   = 'Last name is required.';
        if (! $firstName) $errors['first_name']  = 'First name is required.';

        // Middle initial must be a single letter when provided
        if ($middleInitial && ! preg_match('/^[A-Za-z]$/', $middleInitial)) {
            $errors['middle_initial'] = 'Middle initial must be a single letter.';
        }

        if (! empty($errors)) {
            return response()->json(['errors' => $errors], 422);
        }

        // ---- Duplicate check ----
        if (QrRegistration::where('school_id', $schoolId)->exists()) {
            return response()->json([
                'error' => "School ID \"{$schoolId}\" is already registered for QR attendance.",
                'code'  => 'ALREADY_REGISTERED',
            ], 409);
        }

        // ---- Create registration ----
        $token = (string) Str::uuid();

        $registration = QrRegistration::create([
            'school_id'       => $schoolId,
            'last_name'       => $lastName,
            'first_name'      => $firstName,
            'middle_initial'  => $middleInitial ?: null,
            'qr_token'        => $token,
            'qr_generated_at' => now(),
        ]);

        // ---- Log the activity if the session exists ----
        // Registration is public so there may be no logged-in admin;
        // we log only when a session user is present.
        if (session('user_id')) {
            ActivityLogger::log(
                'qr_register',
                "QR registered: {$firstName} {$lastName} ({$schoolId})"
            );
        }

        return response()->json([
            'success'          => true,
            'message'          => 'QR registration successful.',
            'school_id'        => $registration->school_id,
            'last_name'        => $registration->last_name,
            'first_name'       => $registration->first_name,
            'middle_initial'   => $registration->middle_initial,
            'qr_token'         => $registration->qr_token,
            'qr_generated_at'  => $registration->qr_generated_at->toDateTimeString(),
        ], 201);
    }

    // ---------------------------------------------------------------
    // GET /api/qr/lookup/{token}  — PUBLIC
    //
    // Called by the webcam QR scanner after it decodes a QR image.
    // Receives the raw UUID that was encoded in the QR and returns
    // the matching student/staff identity so the UI can display it.
    //
    // Returns 404 when the token does not match any registration —
    // this covers both "not registered" and tampered/random QR codes.
    // ---------------------------------------------------------------
    public function lookup(string $token): JsonResponse
    {
        $token = trim($token);

        if (! $token) {
            return response()->json(['error' => 'Token is required.'], 400);
        }

        $reg = QrRegistration::where('qr_token', $token)->first();

        if (! $reg) {
            return response()->json([
                'error' => 'QR code not recognised. Please register for QR attendance.',
                'code'  => 'NOT_FOUND',
            ], 404);
        }

        $mi       = $reg->middle_initial ? ' ' . $reg->middle_initial . '.' : '';
        $fullName = "{$reg->first_name}{$mi} {$reg->last_name}";

        return response()->json([
            'success'         => true,
            'school_id'       => $reg->school_id,
            'last_name'       => $reg->last_name,
            'first_name'      => $reg->first_name,
            'middle_initial'  => $reg->middle_initial,
            'full_name'       => $fullName,
            'qr_generated_at' => $reg->qr_generated_at->toDateTimeString(),
        ]);
    }

    // ---------------------------------------------------------------
    // GET /api/qr/token/{schoolId}  — PUBLIC
    //
    // Returns the QR token for a given school ID so a user can
    // re-download their QR code without admin intervention.
    // Returns only the token and identity — no sensitive data.
    // ---------------------------------------------------------------
    public function getToken(string $schoolId): JsonResponse
    {
        $schoolId = $this->normalise($schoolId);

        $reg = QrRegistration::where('school_id', $schoolId)->first();

        if (! $reg) {
            return response()->json(['error' => 'School ID not found.'], 404);
        }

        return response()->json([
            'school_id'       => $reg->school_id,
            'last_name'       => $reg->last_name,
            'first_name'      => $reg->first_name,
            'middle_initial'  => $reg->middle_initial,
            'qr_token'        => $reg->qr_token,
            'qr_generated_at' => $reg->qr_generated_at->toDateTimeString(),
        ]);
    }

    // ---------------------------------------------------------------
    // GET /api/qr/cards  — PROTECTED (auth.session)
    //
    // Lists all QR-registered users, newest first.
    // Used by the admin panel table on the QR Registration page.
    // ---------------------------------------------------------------
    public function listCards(): JsonResponse
    {
        $cards = QrRegistration::orderByDesc('created_at')->get([
            'id', 'school_id', 'last_name', 'first_name',
            'middle_initial', 'qr_token', 'qr_generated_at', 'created_at',
        ]);

        return response()->json(['cards' => $cards, 'total' => $cards->count()]);
    }

    // ---------------------------------------------------------------
    // POST /api/qr/regenerate  — PROTECTED (auth.session)
    //
    // Issues a brand-new UUID token for an existing registration.
    // The old token immediately becomes invalid for attendance scanning.
    // Only admins can perform this action.
    //
    // Required body: { school_id }
    // ---------------------------------------------------------------
    public function regenerate(Request $request): JsonResponse
    {
        $schoolId = $this->normalise($request->input('school_id', ''));

        if (! $schoolId) {
            return response()->json(['error' => 'school_id is required.'], 400);
        }

        $reg = QrRegistration::where('school_id', $schoolId)->first();

        if (! $reg) {
            return response()->json(['error' => 'School ID not found.'], 404);
        }

        $newToken = (string) Str::uuid();

        $reg->update([
            'qr_token'        => $newToken,
            'qr_generated_at' => now(),
        ]);

        ActivityLogger::log(
            'qr_regenerate',
            "QR token regenerated for {$reg->first_name} {$reg->last_name} ({$schoolId})"
        );

        return response()->json([
            'success'         => true,
            'message'         => 'QR token regenerated successfully.',
            'school_id'       => $reg->school_id,
            'qr_token'        => $newToken,
            'qr_generated_at' => $reg->qr_generated_at->toDateTimeString(),
        ]);
    }

    // ---------------------------------------------------------------
    // PUT /api/qr/cards/{schoolId}  — PROTECTED (auth.session)
    //
    // Updates name fields for an existing QR registration.
    // Only fields explicitly sent in the request body are changed.
    // school_id itself cannot be changed — it is the primary key.
    // ---------------------------------------------------------------
    public function updateCard(Request $request, string $schoolId): JsonResponse
    {
        $schoolId = $this->normalise($schoolId);

        $reg = QrRegistration::where('school_id', $schoolId)->first();

        if (! $reg) {
            return response()->json(['error' => 'School ID not found.'], 404);
        }

        $updates = [];

        if ($request->has('last_name')) {
            $v = trim($request->input('last_name'));
            if (! $v) return response()->json(['error' => 'Last name cannot be empty.'], 422);
            $updates['last_name'] = $v;
        }

        if ($request->has('first_name')) {
            $v = trim($request->input('first_name'));
            if (! $v) return response()->json(['error' => 'First name cannot be empty.'], 422);
            $updates['first_name'] = $v;
        }

        if ($request->has('middle_initial')) {
            $v = trim($request->input('middle_initial'));
            if ($v && ! preg_match('/^[A-Za-z]$/', $v)) {
                return response()->json(['error' => 'Middle initial must be a single letter.'], 422);
            }
            $updates['middle_initial'] = $v ?: null;
        }

        if (empty($updates)) {
            return response()->json(['error' => 'Nothing to update.'], 400);
        }

        $reg->update($updates);

        ActivityLogger::log(
            'qr_update',
            "QR registration updated: {$reg->first_name} {$reg->last_name} ({$schoolId})"
        );

        return response()->json([
            'success'   => true,
            'message'   => 'Registration updated.',
            'school_id' => $reg->school_id,
        ]);
    }

    // ---------------------------------------------------------------
    // DELETE /api/qr/cards/{schoolId}  — PROTECTED (auth.session)
    //
    // Permanently removes a QR registration.
    // The student's QR code will no longer be recognised for attendance
    // until they re-register.
    // ---------------------------------------------------------------
    public function deleteCard(string $schoolId): JsonResponse
    {
        $schoolId = $this->normalise($schoolId);

        $reg = QrRegistration::where('school_id', $schoolId)->first();

        if (! $reg) {
            return response()->json(['error' => 'School ID not found.'], 404);
        }

        $name = "{$reg->first_name} {$reg->last_name}";
        $reg->delete();

        ActivityLogger::log('qr_delete', "QR registration deleted: {$name} ({$schoolId})");

        return response()->json(['message' => 'QR registration removed.']);
    }
}
