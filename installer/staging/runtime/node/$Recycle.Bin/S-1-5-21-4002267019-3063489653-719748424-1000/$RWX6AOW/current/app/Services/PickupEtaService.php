<?php

namespace App\Services;

use App\Models\Empresa;
use Carbon\Carbon;

class PickupEtaService
{
    /**
     * Calculate the estimated pickup time for an order
     */
    public function calculateEta(Empresa $empresa, ?Carbon $fromTime = null): Carbon
    {
        $now = $fromTime ?? Carbon::now('America/Monterrey');

        $etaHours = (float) ($empresa->pickup_eta_hours ?? 2.0);
        $horaInicio = $empresa->hora_atencion_inicio ?? '08:00';
        $horaFin = $empresa->hora_atencion_fin ?? '18:00';

        // Parse business hours
        [$inicioHour, $inicioMin] = explode(':', $horaInicio);
        [$finHour, $finMin] = explode(':', $horaFin);

        $inicioHour = (int) $inicioHour;
        $inicioMin = (int) $inicioMin;
        $finHour = (int) $finHour;
        $finMin = (int) $finMin;

        // Calculate proposed ETA
        $eta = $now->copy()->addHours($etaHours);

        // Get business hours for the ETA day
        $businessStart = $eta->copy()->setTime($inicioHour, $inicioMin, 0);
        $businessEnd = $eta->copy()->setTime($finHour, $finMin, 0);

        // If current time is before business hours, start from business open
        $todayStart = $now->copy()->setTime($inicioHour, $inicioMin, 0);
        $todayEnd = $now->copy()->setTime($finHour, $finMin, 0);

        if ($now->lt($todayStart)) {
            // Before business hours - calculate from today's opening
            $eta = $todayStart->copy()->addHours($etaHours);
        } elseif ($now->gt($todayEnd)) {
            // After business hours - calculate from tomorrow's opening
            $eta = $todayStart->copy()->addDay()->addHours($etaHours);
        }

        // Recalculate business end for the ETA day
        $businessEnd = $eta->copy()->setTime($finHour, $finMin, 0);

        // If ETA falls after business hours, move to next day
        if ($eta->gt($businessEnd)) {
            // Move to next day at business start + remaining hours
            $remainingHours = $eta->diffInMinutes($businessEnd) / 60;
            $eta = $businessEnd->copy()->addDay()->setTime($inicioHour, $inicioMin, 0)->addHours($remainingHours);
        }

        // Ensure ETA is not before business start
        $businessStart = $eta->copy()->setTime($inicioHour, $inicioMin, 0);
        if ($eta->lt($businessStart)) {
            $eta = $businessStart;
        }

        return $eta;
    }

    /**
     * Format ETA for display
     */
    public function formatEta(Carbon $eta): string
    {
        $now = Carbon::now('America/Monterrey');

        if ($eta->isToday()) {
            return 'Hoy a las ' . $eta->format('H:i');
        } elseif ($eta->isTomorrow()) {
            return 'Mañana a las ' . $eta->format('H:i');
        } else {
            return $eta->format('d/m/Y H:i');
        }
    }

    /**
     * Check if empresa is currently open
     */
    public function isOpen(Empresa $empresa): bool
    {
        $now = Carbon::now('America/Monterrey');

        $horaInicio = $empresa->hora_atencion_inicio ?? '08:00';
        $horaFin = $empresa->hora_atencion_fin ?? '18:00';

        [$inicioHour, $inicioMin] = explode(':', $horaInicio);
        [$finHour, $finMin] = explode(':', $horaFin);

        $start = $now->copy()->setTime((int)$inicioHour, (int)$inicioMin, 0);
        $end = $now->copy()->setTime((int)$finHour, (int)$finMin, 0);

        return $now->between($start, $end);
    }

    /**
     * Get available pickup slots for today/tomorrow
     */
    public function getAvailableSlots(Empresa $empresa, int $days = 2): array
    {
        $slots = [];
        $now = Carbon::now('America/Monterrey');
        $etaHours = (float) ($empresa->pickup_eta_hours ?? 2.0);

        $horaInicio = $empresa->hora_atencion_inicio ?? '08:00';
        $horaFin = $empresa->hora_atencion_fin ?? '18:00';

        [$inicioHour, $inicioMin] = explode(':', $horaInicio);
        [$finHour, $finMin] = explode(':', $horaFin);

        for ($d = 0; $d < $days; $d++) {
            $day = $now->copy()->addDays($d);
            $dayStart = $day->copy()->setTime((int)$inicioHour, (int)$inicioMin, 0);
            $dayEnd = $day->copy()->setTime((int)$finHour, (int)$finMin, 0);

            // Minimum pickup time
            $minPickup = $now->copy()->addHours($etaHours);

            if ($d === 0 && $minPickup->gt($dayEnd)) {
                // Can't pickup today, skip
                continue;
            }

            $slotStart = $d === 0 ? max($dayStart, $minPickup) : $dayStart;

            // Generate hourly slots
            $current = $slotStart->copy()->minute(0)->second(0);
            if ($current->lt($slotStart)) {
                $current->addHour();
            }

            while ($current->lte($dayEnd)) {
                if ($current->gte($minPickup)) {
                    $slots[] = [
                        'datetime' => $current->copy(),
                        'label' => $this->formatEta($current),
                        'value' => $current->toIso8601String(),
                    ];
                }
                $current->addHour();
            }
        }

        return $slots;
    }
}
