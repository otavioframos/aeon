package com.otavioframos.vela;

import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.util.Locale;

@CapacitorPlugin(name = "VelaWidget")
public class VelaWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        JSObject data = call.getData();
        SharedPreferences.Editor editor = VelaWidgetMetrics.prefs(getContext()).edit();
        editor.putString("realBalance", doubleString(data.optDouble("realBalance", 0)));
        editor.putString("freeThisMonth", doubleString(data.optDouble("freeThisMonth", 0)));
        editor.putString("desireSpent", doubleString(data.optDouble("desireSpent", 0)));
        editor.putString("desireBudget", doubleString(data.optDouble("desireBudget", 0)));
        editor.putInt("daysInMonth", data.optInt("daysInMonth", 30));
        editor.putInt("todayDay", data.optInt("todayDay", 1));
        editor.putInt("firstWeekday", data.optInt("firstWeekday", 0));
        editor.putString("desireDaily", dailyString(data.optJSONArray("desireDaily")));
        editor.apply();

        VelaWidgetProvider.updateAll(getContext());
        call.resolve();
    }

    private static String doubleString(double value) {
        return String.format(Locale.US, "%.2f", value);
    }

    private static String dailyString(JSONArray values) {
        if (values == null) return "";
        double[] out = new double[values.length()];
        for (int i = 0; i < values.length(); i += 1) {
            out[i] = values.optDouble(i, 0);
        }
        return VelaWidgetMetrics.dailyToString(out);
    }
}
