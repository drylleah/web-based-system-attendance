<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('qr_registrations')) return;

        Schema::create('qr_registrations', function (Blueprint $table) {
            $table->id();

            // School ID — the primary identifier for the student/staff member.
            // Stored normalised (uppercase, no extra spaces) matching the RFID convention.
            $table->string('school_id', 50)->unique()->comment('School ID — used as the QR attendance identifier');

            $table->string('last_name', 100);
            $table->string('first_name', 100);
            $table->string('middle_initial', 5)->nullable();

            // qr_token is the actual value encoded inside the QR image.
            // It is a UUID generated on registration and never changes unless an
            // admin explicitly regenerates it.
            $table->string('qr_token', 100)->unique()->comment('UUID encoded in the QR image');

            // Records when the QR was first generated (or last regenerated).
            $table->timestamp('qr_generated_at')->useCurrent();

            // Standard Laravel timestamps (created_at / updated_at).
            $table->timestamps();

            $table->index('school_id');
            $table->index('qr_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_registrations');
    }
};
