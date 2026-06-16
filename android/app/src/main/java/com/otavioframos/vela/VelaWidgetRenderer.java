package com.otavioframos.vela;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;

import java.text.NumberFormat;
import java.util.Locale;

final class VelaWidgetRenderer {
    private static final int SIZE = 512;
    private static final int GRID = 21;
    private static final int BG = Color.rgb(21, 28, 36);
    private static final int EMPTY = Color.rgb(34, 43, 51);
    private static final int SAND = Color.rgb(236, 243, 249);
    private static final int RED = Color.rgb(163, 6, 6);
    private static final int MUTED = Color.rgb(150, 166, 174);
    private static final int GREEN = Color.rgb(36, 126, 92);
    private static final float CARD_RADIUS = SIZE * 0.12f;

    private VelaWidgetRenderer() {}

    static Bitmap render(VelaWidgetMetrics metrics, int screen) {
        Bitmap bitmap = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        drawPanel(canvas, paint);
        if (screen == 1) {
            drawNumbers(canvas, paint, metrics);
        } else if (screen == 2) {
            drawCalendar(canvas, paint, metrics);
        } else {
            drawSandPit(canvas, paint, metrics);
        }
        if (screen != 0) drawPageDots(canvas, paint, screen);
        return bitmap;
    }

    private static void drawPanel(Canvas canvas, Paint paint) {
        canvas.drawColor(Color.TRANSPARENT);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(BG);
        canvas.drawRoundRect(new RectF(0, 0, SIZE, SIZE), CARD_RADIUS, CARD_RADIUS, paint);
    }

    private static void drawSandPit(Canvas canvas, Paint paint, VelaWidgetMetrics metrics) {
        double ratio = metrics.desireBudget > 0
            ? metrics.desireSpent / metrics.desireBudget
            : (metrics.desireSpent > 0 ? 2 : 0);
        boolean overflow = ratio > 1 || metrics.freeThisMonth < 0;
        double negativeFill = metrics.freeThisMonth < 0
            ? Math.abs(metrics.freeThisMonth) / Math.max(Math.max(metrics.desireBudget, metrics.desireSpent), Math.abs(metrics.freeThisMonth))
            : 0;
        double fill = overflow
            ? Math.max(ratio > 1 ? ratio - 1 : 0, negativeFill)
            : ratio;
        fill = Math.max(0, Math.min(1, fill));
        if (overflow && fill < 0.12) fill = 0.12;

        float left = 38;
        float top = 38;
        float area = SIZE - left * 2;
        float pitch = area / GRID;
        float radius = pitch * 0.36f;
        float center = (GRID - 1) / 2f;
        int fillRows = (int) Math.round(GRID * fill);

        for (int y = 0; y < GRID; y += 1) {
            for (int x = 0; x < GRID; x += 1) {
                float cx = left + x * pitch + pitch / 2f;
                float cy = top + y * pitch + pitch / 2f;
                float centered = 1f - Math.min(1f, Math.abs(x - center) / center);
                int mound = (int) Math.round(Math.pow(centered, 2.15) * 4);
                int jitter = (int) Math.round((noise(x, 3) - 0.5) * 3);
                int surface = GRID - fillRows - mound + jitter;
                boolean inSand = y >= surface;
                boolean stream = !overflow && ratio > 0.04 && Math.abs(x - center) < 0.75 && y < surface && y < GRID * 0.54;

                int color = overflow ? SAND : EMPTY;
                if (inSand) {
                    color = overflow ? RED : SAND;
                }
                if (stream) {
                    color = SAND;
                }

                paint.setColor(color);
                canvas.drawCircle(cx, cy, radius, paint);
            }
        }
    }

    private static void drawNumbers(Canvas canvas, Paint paint, VelaWidgetMetrics metrics) {
        drawDotBackdrop(canvas, paint, 0.22f);
        drawLabel(canvas, paint, "REAL BALANCE", 48, 92);
        drawMoney(canvas, paint, metrics.realBalance, 48, 180, SAND, 54);

        paint.setColor(Color.argb(56, 134, 157, 148));
        paint.setStrokeWidth(2);
        canvas.drawLine(48, 246, SIZE - 48, 246, paint);

        drawLabel(canvas, paint, "FREE THIS MONTH", 48, 308);
        drawMoney(canvas, paint, metrics.freeThisMonth, 48, 396, metrics.freeThisMonth < 0 ? RED : SAND, 54);
    }

    private static void drawCalendar(Canvas canvas, Paint paint, VelaWidgetMetrics metrics) {
        drawDotBackdrop(canvas, paint, 0.16f);
        drawLabel(canvas, paint, "DESIRES RHYTHM", 48, 70);

        String[] labels = { "D", "S", "T", "Q", "Q", "S", "S" };
        paint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        paint.setTextSize(22);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setColor(SAND);

        float startX = 66;
        float startY = 126;
        float gapX = 63;
        float gapY = 58;
        for (int i = 0; i < labels.length; i += 1) {
            canvas.drawText(labels[i], startX + i * gapX, 106, paint);
        }

        double dayBudget = metrics.daysInMonth > 0 ? metrics.desireBudget / metrics.daysInMonth : 0;
        for (int day = 1; day <= metrics.daysInMonth; day += 1) {
            int index = metrics.firstWeekday + day - 1;
            int col = index % 7;
            int row = index / 7;
            float cx = startX + col * gapX;
            float cy = startY + row * gapY;
            double value = day - 1 < metrics.desireDaily.length ? metrics.desireDaily[day - 1] : 0;

            int color = EMPTY;
            if (value > 0) {
                color = value > dayBudget && dayBudget > 0 ? RED : SAND;
            }

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(color);
            canvas.drawCircle(cx, cy, 10, paint);

            if (day == metrics.todayDay) {
                paint.setStyle(Paint.Style.STROKE);
                paint.setStrokeWidth(3);
                paint.setColor(withAlpha(GREEN, 230));
                canvas.drawCircle(cx, cy, 17, paint);
                paint.setStyle(Paint.Style.FILL);
            }
        }
    }

    private static void drawDotBackdrop(Canvas canvas, Paint paint, float opacity) {
        float left = 38;
        float top = 38;
        float area = SIZE - left * 2;
        float pitch = area / GRID;
        paint.setColor(opacity >= 0.2f ? EMPTY : withAlpha(EMPTY, (int) (255 * opacity)));
        for (int y = 0; y < GRID; y += 1) {
            for (int x = 0; x < GRID; x += 1) {
                canvas.drawCircle(left + x * pitch + pitch / 2f, top + y * pitch + pitch / 2f, pitch * 0.22f, paint);
            }
        }
    }

    private static void drawPageDots(Canvas canvas, Paint paint, int active) {
        float x = SIZE - 34;
        float y = SIZE / 2f - 20;
        for (int i = 0; i < 3; i += 1) {
            paint.setColor(i == active ? SAND : withAlpha(MUTED, 130));
            canvas.drawCircle(x, y + i * 20, i == active ? 4.5f : 3.2f, paint);
        }
    }

    private static void drawLabel(Canvas canvas, Paint paint, String text, float x, float y) {
        paint.setStyle(Paint.Style.FILL);
        paint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        paint.setTextSize(22);
        paint.setTextAlign(Paint.Align.LEFT);
        paint.setColor(withAlpha(MUTED, 220));
        canvas.drawText(text, x, y, paint);
    }

    private static void drawMoney(Canvas canvas, Paint paint, double value, float x, float y, int color, float size) {
        paint.setStyle(Paint.Style.FILL);
        paint.setTypeface(Typeface.create(Typeface.SERIF, Typeface.NORMAL));
        paint.setTextSize(size);
        paint.setTextAlign(Paint.Align.LEFT);
        paint.setColor(withAlpha(color, 228));
        canvas.drawText(formatMoney(value), x, y, paint);
    }

    private static String formatMoney(double value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
        format.setMaximumFractionDigits(Math.abs(value) >= 10000 ? 0 : 2);
        return format.format(value).replace("\u00a0", " ");
    }

    private static int withAlpha(int color, int alpha) {
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color));
    }

    private static double noise(int x, int y) {
        double value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return value - Math.floor(value);
    }
}
