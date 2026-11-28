package com.notemov.notmusic;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import com.getcapacitor.CapacitorWebView;

public class BackgroundWebView extends CapacitorWebView {
    public static volatile boolean isMediaPlaying = false;

    public BackgroundWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        if (visibility != View.VISIBLE && isMediaPlaying) {
            super.onWindowVisibilityChanged(View.VISIBLE);
            return;
        }
        super.onWindowVisibilityChanged(visibility);
    }

    @Override
    public void onWindowFocusChanged(boolean hasWindowFocus) {
        if (!hasWindowFocus && isMediaPlaying) {
            super.onWindowFocusChanged(true);
            return;
        }
        super.onWindowFocusChanged(hasWindowFocus);
    }

    @Override
    public void onPause() {
        if (isMediaPlaying) {
            return;
        }
        super.onPause();
    }

    @Override
    public void pauseTimers() {
        if (isMediaPlaying) {
            return;
        }
        super.pauseTimers();
    }
}
