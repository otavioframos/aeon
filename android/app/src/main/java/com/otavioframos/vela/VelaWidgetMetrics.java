package com.otavioframos.vela;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Calendar;
import java.util.Locale;

final class VelaWidgetMetrics {
    static final String PREFS = "vela_widget_metrics";

    final double realBalance;
    final double freeThisMonth;
    final double desireSpent;
    final double desireBudget;
    final int year;
    final int month;
    final int daysInMonth;
    final int todayDay;
    final int firstWeekday;
    final double[] desireDaily;

    private VelaWidgetMetrics(
        double realBalance,
        double freeThisMonth,
        double desireSpent,
        double desireBudget,
        int year,
        int month,
        int daysInMonth,
        int todayDay,
        int firstWeekday,
        double[] desireDaily
    ) {
        this.realBalance = realBalance;
        this.freeThisMonth = freeThisMonth;
        this.desireSpent = desireSpent;
        this.desireBudget = desireBudget;
        this.year = year;
        this.month = month;
        this.daysInMonth = daysInMonth;
        this.todayDay = todayDay;
        this.firstWeekday = firstWeekday;
        this.desireDaily = desireDaily;
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static VelaWidgetMetrics read(Context context) {
        SharedPreferences prefs = prefs(context);
        Calendar calendar = Calendar.getInstance();
        int currentYear = calendar.get(Calendar.YEAR);
        int currentMonth = calendar.get(Calendar.MONTH);
        int currentDay = calendar.get(Calendar.DAY_OF_MONTH);
        int storedYear = prefs.getInt("year", currentYear);
        int storedMonth = prefs.getInt("month", currentMonth);
        boolean staleMonth = storedYear != currentYear || storedMonth != currentMonth;
        int days = staleMonth ? calendar.getActualMaximum(Calendar.DAY_OF_MONTH) : Math.max(28, Math.min(31, prefs.getInt("daysInMonth", 30)));
        int firstWeekday = staleMonth ? firstWeekday(currentYear, currentMonth) : Math.max(0, Math.min(6, prefs.getInt("firstWeekday", 0)));
        return new VelaWidgetMetrics(
            readDouble(prefs, "realBalance", 0),
            readDouble(prefs, "freeThisMonth", 0),
            staleMonth ? 0 : readDouble(prefs, "desireSpent", 0),
            readDouble(prefs, "desireBudget", 0),
            currentYear,
            currentMonth,
            days,
            Math.max(1, Math.min(days, staleMonth ? currentDay : prefs.getInt("todayDay", 1))),
            firstWeekday,
            staleMonth ? new double[days] : parseDaily(prefs.getString("desireDaily", ""), days)
        );
    }

    static String dailyToString(double[] values) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < values.length; i += 1) {
            if (i > 0) builder.append(',');
            builder.append(String.format(Locale.US, "%.2f", values[i]));
        }
        return builder.toString();
    }

    private static double readDouble(SharedPreferences prefs, String key, double fallback) {
        try {
            return Double.parseDouble(prefs.getString(key, Double.toString(fallback)));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private static int firstWeekday(int year, int month) {
        Calendar calendar = Calendar.getInstance();
        calendar.set(year, month, 1);
        return calendar.get(Calendar.DAY_OF_WEEK) - 1;
    }

    private static double[] parseDaily(String raw, int days) {
        double[] values = new double[days];
        if (raw == null || raw.isEmpty()) return values;

        String[] parts = raw.split(",");
        for (int i = 0; i < Math.min(days, parts.length); i += 1) {
            try {
                values[i] = Double.parseDouble(parts[i]);
            } catch (NumberFormatException ignored) {
                values[i] = 0;
            }
        }
        return values;
    }
}
