
import React, { useState, useEffect } from 'react';

export const Timer = ({ startTimeStr }: { startTimeStr: string }) => {
    const [elapsed, setElapsed] = useState('0 мин.');

    useEffect(() => {
        if (!startTimeStr) return;

        const update = () => {
            const now = new Date();
            const [h, m] = startTimeStr.split(':').map(Number);
            
            if (isNaN(h) || isNaN(m)) return;

            const startDate = new Date();
            startDate.setHours(h, m, 0, 0);

            // Handle edge case: if start time is 23:55 and now is 00:05, start was yesterday
            if (startDate.getTime() > now.getTime()) {
                startDate.setDate(startDate.getDate() - 1);
            }

            const diff = Math.max(0, now.getTime() - startDate.getTime());
            
            const totalSeconds = Math.floor(diff / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            
            setElapsed(`${minutes} мин.`);
        };

        update();
        const interval = setInterval(update, 5000); // Обновляем раз в 5 секунд, так как точность до секунд больше не нужна
        return () => clearInterval(interval);
    }, [startTimeStr]);

    return <span className="font-mono tabular-nums font-bold text-blue-500">{elapsed}</span>;
};
