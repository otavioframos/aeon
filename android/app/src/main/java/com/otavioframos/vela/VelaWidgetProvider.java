package com.otavioframos.vela;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.widget.RemoteViews;

public class VelaWidgetProvider extends AppWidgetProvider {
    static final String ACTION_NEXT = "com.otavioframos.vela.widget.NEXT";
    private static final String SCREEN_PREFIX = "screen_";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (!ACTION_NEXT.equals(intent.getAction())) return;

        int widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        SharedPreferences prefs = VelaWidgetMetrics.prefs(context);
        int current = prefs.getInt(SCREEN_PREFIX + widgetId, 0);
        prefs.edit().putInt(SCREEN_PREFIX + widgetId, (current + 1) % 3).apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            updateWidget(context, manager, widgetId);
        } else {
            updateAll(context);
        }
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, VelaWidgetProvider.class));
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        SharedPreferences prefs = VelaWidgetMetrics.prefs(context);
        int screen = prefs.getInt(SCREEN_PREFIX + appWidgetId, 0);
        VelaWidgetMetrics metrics = VelaWidgetMetrics.read(context);
        Bitmap bitmap = VelaWidgetRenderer.render(metrics, screen);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.vela_widget);
        views.setImageViewBitmap(R.id.vela_widget_image, bitmap);
        PendingIntent next = nextIntent(context, appWidgetId);
        views.setOnClickPendingIntent(R.id.vela_widget_root, next);
        views.setOnClickPendingIntent(R.id.vela_widget_image, next);
        manager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent nextIntent(Context context, int appWidgetId) {
        Intent intent = new Intent(context, VelaWidgetProvider.class);
        intent.setAction(ACTION_NEXT);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        return PendingIntent.getBroadcast(
            context,
            appWidgetId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
