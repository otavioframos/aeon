package com.otavioframos.vela;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Locale;

final class VelaWidgetMetrics {
    static final String PREFS = "vela_widget_metrics";

    final double realBalance;
    final double freeThisMonth;
    final double desireSpent;
    final double desireBudget;
    final int daysInMonth;
    final int todayDay;
    final int firstWeekday;
    final double[] desireDaily;

    private VelaWidgetMetrics(
        double realBalance,
        double freeThisMonth,
        double desireSpent,
        double desireBudget,
        int daysInMonth,
        int todayDay,
        int firstWeekday,
        double[] desireDaily
    ) {
        this.realBalance = realBalance;
        this.freeThisMonth = freeThisMonth;
        this.desireSpent = desireSpent;
        this.desireBudget = desireBudget;
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
        int days = Math.max(28, Math.min(31, prefs.getInt("daysInMonth", 30)));
        return new VelaWidgetMetrics(
            readDouble(prefs, "realBalance", 0),
            readDouble(prefs, "freeThisMonth", 0),
            readDouble(prefs, "desireSpent", 0),
            readDouble(prefs, "desireBudget", 0),
            days,
            Math.max(1, Math.min(days, prefs.getInt("todayDay", 1))),
            Math.max(0, Math.min(6, prefs.getInt("firstWeekday", 0))),
            parseDaily(prefs.getString("desireDaily", ""), days)
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
