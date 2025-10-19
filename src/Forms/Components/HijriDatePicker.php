<?php

namespace MohamedSabil83\FilamentHijriPicker\Forms\Components;

use Alkoumi\LaravelHijriDate\Hijri;
use Closure;
use Filament\Forms;
use Illuminate\Support\Carbon;

class HijriDatePicker extends Forms\Components\DatePicker
{
    protected string $view = 'filament-hijri-picker::components.hijri-date-time-picker';

    protected ?string $hMinDate = null;

    public function HminDate(string | \DateTime | Carbon $date): static
    {
        // 1. Parse and store the minimum date
        $minDateCarbon = Carbon::parse($date)->startOfDay();
        $this->hMinDate = $date;

        // --- VALIDATION WITH THE CORRECT PACKAGE ---
        $this->rule(
            static function () use ($minDateCarbon) {
                return
                    /**
                     * @param string $attribute The database column name
                     * @param string $value The field's state (your Hijri date string)
                     * @param Closure $fail The function to call if validation fails
                     */
                    static function (string $attribute, $value, Closure $fail) use ($minDateCarbon) {

                        if (! $value) {
                            return;
                        }

                        try {

                            $hijriDateOnly = explode(' ', $value)[0];
                            $year = explode('-', $hijriDateOnly)[0];
                            $month = explode('-', $hijriDateOnly)[1];
                            $day = explode('-', $hijriDateOnly)[2];

                            $gregorianString = Hijri::DateToGregorianFromDMY($day, $month ,$year);

                            $stateAsGregorian = Carbon::parse($gregorianString)->startOfDay();

                            if ($stateAsGregorian->isBefore($minDateCarbon)) {
                                $fail("The date must be on or after " . $minDateCarbon->format('Y-m-d'));
                            }

                        } catch (\Exception $e) {
                            $fail("The date is not in a valid Hijri format. (Error: " . $e->getMessage() . ")");
                        }
                    };
            },
            true
        );

        return $this;
    }


    public function getHMinDate(): ?string
    {
        if (! $this->hMinDate) {
            return null;
        }

        return Carbon::parse($this->hMinDate)->format('Y-m-d');
    }
}
