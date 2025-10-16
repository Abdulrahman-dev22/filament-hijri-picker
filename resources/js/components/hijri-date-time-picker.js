import moment from "moment-hijri";
import "moment-timezone";


export default function hijriDateTimePickerFormComponent({
 displayFormat,
 firstDayOfWeek,
 isAutofocused,
 locale,
 shouldCloseOnDateSelection,
 state,
 hasTime,
}) {
    const timezone = "Asia/Riyadh";
    const max_allowed_year = 2077;
    const min_allowed_year = 1319;

    return {
        daysInFocusedMonth: [],
        displayFormat: hasTime? 'iYYYY/iM/iD HH:mm:ss': 'iYYYY/iM/iD',
        displayText: '',
        emptyDaysInFocusedMonth: [],
        focusedDate: null,
        focusedMonth: null,
        focusedYear: null,
        hour: null,
        isClearingState: false,
        minute: null,
        second: null,
        state,
        dayLabels: [],
        months: [],

        init: function () {
            moment().locale(locale);

            this.focusedDate = this.getSelectedDate() ?? moment().startOf("iDate");
            let date = this.getSelectedDate() ?? moment().startOf("iDate");

            if (this.getMaxDate() && date.isAfter(this.getMaxDate())) date = null;
            if (this.getMinDate() && date.isBefore(this.getMinDate())) date = null;

            this.hour = date?.hour() ?? 0;
            this.minute = date?.minute() ?? 0;
            this.second = date?.second() ?? 0;

            this.setDisplayText();
            this.setMonths();
            this.setDayLabels();

            if (isAutofocused) {
                this.$nextTick(() => this.togglePanelVisibility(this.$refs.button));
            }

            this.$watch("focusedMonth", (new_val, _) => {
                const newMonth = parseInt(new_val);
                const oldMonth = this.focusedDate.iMonth();


                if (oldMonth === newMonth) return;

                // clone before mutating to avoid side effects
                this.focusedDate = this.focusedDate.clone().iMonth(newMonth);


                this.setupDaysGrid();
            });



            this.$watch("focusedYear", (new_val, _) => {
                var new_year = parseInt(new_val);
                if (new_year > max_allowed_year) {
                    this.focusedYear = max_allowed_year;
                    return;
                }
                if (new_year?.toString()?.length > 4) {
                    new_year = parseInt(new_year.toString().substring(0, 4));
                }

                if (!new_year || new_year?.toString()?.length !== 4) {
                    return;
                }

                if (new_year < min_allowed_year) {
                    this.focusedYear = min_allowed_year;
                    return;
                }
                // let year = +this.focusedYear;

                if (!Number.isInteger(new_year)) {
                    new_year = moment().iYear(); // Hijri year

                    // this.focusedYear = year;
                }
                if (this.focusedDate.iYear() === new_year) {
                    return;
                }

                this.focusedDate = this.focusedDate.iYear(new_year); // Set year in Hijri
                this.setupDaysGrid();
            });

            this.$watch('focusedDate', () => {
                const month = this.focusedDate.iMonth();
                const year = this.focusedDate.iYear();
                let shouldUpdate = false;

                if (this.focusedMonth !== month) {
                    this.focusedMonth = month;
                    shouldUpdate = true;
                }
                if (this.focusedYear !== year) {
                    this.focusedYear = year;
                    shouldUpdate = true;
                }

                if (shouldUpdate) {
                    this.setupDaysGrid();
                }
            });

            ['hour', 'minute', 'second'].forEach((unit) => {
                this.$watch(unit, () => {
                    this[unit] = +this[unit];
                    if (isNaN(this[unit])) this[unit] = 0;
                    if (this.isClearingState) return;

                    const date = this.getSelectedDate() ?? this.focusedDate;
                    this.setState(date.clone().set(unit, this[unit]));
                });
            });

            this.$watch("state", () => {
                if (this.state === undefined) {
                    return;
                }

                let date = this.getSelectedDate();

                if (date === null) {
                    this.clearState();
                    return;
                }

                if (
                    this.getMaxDate() !== null &&
                    date?.isAfter(this.getMaxDate())
                ) {
                    date = null;
                }
                if (
                    this.getMinDate() !== null &&
                    date?.isBefore(this.getMinDate())
                ) {
                    date = null;
                }

            });
        },

        clearState: function () {
            this.isClearingState = true;
            this.setState(null);

            this.hour = 0;
            this.minute = 0;
            this.second = 0;

            this.$nextTick(() => (this.isClearingState = false));
        },

        dateIsDisabled: function (date) {
            return this.isDateDisabled(date, this.$refs?.disabledDates?.value);
        },

        isDateDisabled: function (date, disabledDates) {
            if (!date) return false;

            if (disabledDates) {
                const list = JSON.parse(disabledDates);
                for (let disabledDate of list) {
                    if (!disabledDate) continue;
                    const parsed = moment(disabledDate, this.displayFormat); // consistent format
                    if (parsed.isValid() && parsed.isSame(date, 'iDay')) {
                        return true;
                    }
                }
            }

            const maxGregorian = this.getMaxDate();
            // console.log('the maxGerogian: ', maxGregorian);
            const max = maxGregorian ? moment(maxGregorian).toHijri() : null;

            const minGregorian = this.getMinDate();
            const min = minGregorian ? moment(minGregorian).toHijri() : null;

            // console.log('Max Hijri:', max ? max.format(this.displayFormat) : null);

            if (max && date.isAfter(max, 'iDay')) return true;
            if (min && date.isBefore(min, 'iDay')) return true;

            return false;
        },


        dayIsDisabled: function (day) {
            return this.dateIsDisabled(this.focusedDate.iDate(day));
        },

        dayIsSelected: function (day) {
            let selectedDate = this.getSelectedDate();

            return (
                selectedDate &&
                selectedDate.iDate() === day &&
                selectedDate.iMonth() === this.focusedDate.iMonth() &&
                selectedDate.iYear() === this.focusedDate.iYear()
            );
        },

        dayIsToday: function (day) {
            let today = moment();
            return (
                today.iDate() === day &&
                today.iMonth() === this.focusedDate.iMonth() &&
                today.iYear() === this.focusedDate.iYear()
            );
        },

        focusPreviousDay() { this.focusedDate.subtract(1, 'day'); },
        focusNextDay() { this.focusedDate.add(1, 'day'); },
        focusPreviousWeek() { this.focusedDate.subtract(1, 'week'); },
        focusNextWeek() { this.focusedDate.add(1, 'week'); },

        getDayLabels() {
            const labels = locale === 'ar'
                ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return firstDayOfWeek === 0 ? labels : [...labels.slice(firstDayOfWeek), ...labels.slice(0, firstDayOfWeek)];
        },

        getMaxDate: function () {
            if (
                this.$refs.maxDate?.value == null ||
                this.$refs.maxDate?.value == ""
            )
                return null;
            let date = moment(this.$refs.maxDate?.value, 'iYYYY/iM/iD');
            return date.isValid() ? date : null;
        },

        getMinDate: function () {
            if (
                this.$refs.minDate?.value == null ||
                this.$refs.minDate?.value == ""
            )
                return null;
            let date = moment(this.$refs.minDate?.value, 'iYYYY/iM/iD');
            return date.isValid() ? date : null;
        },

        getSelectedDate: function () {
            if (!this.state) return null;
            const date = moment(this.state, this.displayFormat,'ar-sa');
            return date.isValid() ? date : null;
        },



        togglePanelVisibility: function () {
            if (!this.isOpen()) {
                this.focusedDate =
                    this.getSelectedDate() ?? this.getMinDate() ?? moment();
                this.setupDaysGrid();
            }
            this.$refs.panel.toggle(this.$refs.button);
        },

        selectDate: function (day = null) {
            if (day) this.setFocusedDay(day);
            this.setState(this.focusedDate);
            if (shouldCloseOnDateSelection) this.togglePanelVisibility();
        },

        setDisplayText: function () {
            const date = this.getSelectedDate();
            this.displayText = date ? date.format(this.displayFormat) : '';

        },

        setMonths() {
            this.months = locale === 'ar'
                ? ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة']
                : ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Alkhirah', 'Rajab', 'Sha’ban', 'Ramadhan', 'Shawwal', 'Thul-Qi’dah', 'Thul-Hijjah'];
        },

        setDayLabels() {
            this.dayLabels = this.getDayLabels();
        },

        setupDaysGrid: function () {
            let date = this.focusedDate ?? moment().startOf('iMonth');
            let startDayOfWeek = date.startOf('iMonth').day();
            startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

            // Correct way to get the number of days in the Hijri month
            let daysInMonth = date.iMonth(date.iMonth()).endOf('iMonth').iDate();

            this.emptyDaysInFocusedMonth = Array.from(
                { length: startDayOfWeek },
                (_, i) => i + 1
            );
            this.daysInFocusedMonth = Array.from(
                { length: daysInMonth },
                (_, i) => i + 1
            );
        },

        setFocusedDay: function(day) {
            // Use the currently displayed month/year, not the selected one or today
            const base = this.focusedDate?.clone() || moment();
            this.focusedDate = base.iDate(day);
        },

        setState: function (date) {
            if (!date || this.dateIsDisabled(date)) return;
            this.state = date
                .hour(this.hour ?? 0)
                .minute(this.minute ?? 0)
                .second(this.second ?? 0)
                .format(this.displayFormat)
            this.setDisplayText();
        },

        isOpen: function () {
            return this.$refs.panel?.style.display === "block";
        },
    };
}
