#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""FPS calculation utility using a deque buffer."""
from collections import deque
import time


class CvFpsCalc(object):
    def __init__(self, buffer_len=10):
        self._start_tick = time.perf_counter()
        self._freq = 1.0
        self._diff_times = deque(maxlen=buffer_len)

    def get(self):
        current_tick = time.perf_counter()
        different_time = current_tick - self._start_tick
        self._start_tick = current_tick

        self._diff_times.append(different_time)

        fps = 1.0 / (sum(self._diff_times) / len(self._diff_times))
        fps_rounded = round(fps, 2)

        return fps_rounded
