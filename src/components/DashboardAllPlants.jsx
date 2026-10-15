import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  FileSpreadsheet,
  Users,
  Layers,
  Calendar,
  Building2,
  Filter as FilterIcon,
  RotateCcw,
  ChevronDown,
  Volume2,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Globe,
  Box,
  Truck,
  Cog,
  Zap,
  FlaskConical,
  ArrowRight,
  ChevronRight,
  Activity,
  Award,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useQC } from '../context/QCContext';
import FilterPopover from './FilterPopover';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

export const DashboardAllPlants = () => {
  const {
    setCurrentView,
    activeDate,
    totalJamOvertime,
    totalTUL,
    uniqueEmployees,
    totalRecords,
    filteredRecords,
    overtimeRecords,
    selectedMonths,
    setSelectedMonths,
    selectedDays,
    setSelectedDays,
    selectedShifts,
    setSelectedShifts,
    selectedPlants,
    setSelectedPlants,
    selectedEmployees,
    setSelectedEmployees,
    plants,
    employees,
    shifts,
    monthList,
    calculateTUL,
    showToast
  } = useQC();

  // Active filter popover dropdown
  const [activePopover, setActivePopover] = useState(null);

  // Reset filter criteria
  const handleResetFilters = () => {
    setSelectedMonths([]);
    setSelectedDays([]);
    setSelectedShifts([]);
    setSelectedPlants([]);
    setSelectedEmployees([]);
    showToast('Filter kriteria berhasil direset.', 'info');
  };

  // Custom ChartJS Plugin: Draw Data Labels on Total TUL Line Points
  const lineDatalabelsPlugin = {
    id: 'lineDatalabelsPluginAllPlants',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.type === 'line' && dataset.label && dataset.label.includes('TUL')) {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta.hidden) {
            meta.data.forEach((element, index) => {
              const val = dataset.data[index];
              if (val !== undefined && val !== null && val > 0) {
                ctx.save();
                ctx.fillStyle = '#FFF8E7';
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.shadowColor = 'rgba(0, 136, 255, 0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(`${val}`, element.x, element.y - 6);
                ctx.restore();
              }
            });
          }
        }
      });
    }
  };

  // -------------------------------------------------------------
  // Calculate Stats for each of the 5 Plants
  // -------------------------------------------------------------
  const plantStats = useMemo(() => {
    const plantConfigs = [
      { id: 'hose', name: 'Plant Hose', label: 'HOSE', icon: Layers, color: '#ec4899', borderGlow: 'rgba(236, 72, 153, 0.4)' },
      { id: 'molded', name: 'Plant Molded', label: 'MOLDED', icon: Box, color: '#0088ff', borderGlow: 'rgba(0, 136, 255, 0.4)' },
      { id: 'subcont', name: 'Plant Subcont', label: 'SUBCONT', icon: Cog, color: '#10b981', borderGlow: 'rgba(16, 185, 129, 0.4)' },
      { id: 'lab-mixing', name: 'Plant Lab Mixing', label: 'LAB MIXING', icon: FlaskConical, color: '#f59e0b', borderGlow: 'rgba(245, 158, 11, 0.4)' },
      { id: 'rvi', name: 'Plant RVI', label: 'RVI', icon: Truck, color: '#a855f7', borderGlow: 'rgba(168, 85, 247, 0.4)' },
      { id: 'qre', name: 'Plant QRE', label: 'QRE', icon: ShieldCheck, color: '#06b6d4', borderGlow: 'rgba(6, 182, 212, 0.4)' }
    ];

    return plantConfigs.map(p => {
      const records = filteredRecords.filter(r => 
        r.dept === p.id || 
        (r.dept === 'lab_mixing' && p.id === 'lab-mixing') ||
        (r.dept === 'mixing' && p.id === 'lab-mixing') || 
        (r.plant && (r.plant.toLowerCase().includes(p.label.toLowerCase()) || r.plant.toLowerCase().includes(p.id)))
      );
      const hours = records.reduce((sum, r) => sum + (Number(r.jamOvertime) || 0), 0);
      const tul = records.reduce((sum, r) => sum + (Number(r.totalTUL) || calculateTUL(Number(r.jamOvertime) || 0, r.isHoliday)), 0);
      const emps = new Set(records.map(r => r.npk)).size;
      const s1Hours = records.filter(r => r.shift === 'Shift 1').reduce((s, r) => s + (Number(r.jamOvertime) || 0), 0);
      const s2Hours = records.filter(r => r.shift === 'Shift 2').reduce((s, r) => s + (Number(r.jamOvertime) || 0), 0);
      return {
        ...p,
        totalHours: Math.round(hours * 10) / 10,
        totalTUL: Math.round(tul * 10) / 10,
        totalEmps: emps,
        totalRecords: records.length,
        shift1Hours: Math.round(s1Hours * 10) / 10,
        shift2Hours: Math.round(s2Hours * 10) / 10
      };
    });
  }, [filteredRecords, calculateTUL]);

  // -------------------------------------------------------------
  // Plant Comparison Chart Data & Options
  // -------------------------------------------------------------
  const plantComparisonData = {
    labels: plantStats.map(p => p.label),
    datasets: [
      {
        type: 'bar',
        label: 'JAM LEMBUR (JAM)',
        data: plantStats.map(p => p.totalHours),
        backgroundColor: plantStats.map(p => p.color),
        hoverBackgroundColor: '#00d2ff',
        borderColor: '#8CC1E9',
        borderWidth: 1,
        borderRadius: 5,
        barPercentage: 0.5,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'TOTAL TUL',
        data: plantStats.map(p => p.totalTUL),
        borderColor: '#fbbf24',
        backgroundColor: '#fbbf24',
        borderWidth: 2.5,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#091a38',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const plantComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#091a38',
        borderColor: '#fbbf24',
        borderWidth: 1,
        titleColor: '#8CC1E9',
        bodyColor: '#FFF8E7',
        padding: 9,
        callbacks: {
          label: (context) => {
            if (context.dataset.yAxisID === 'y1') return `Total TUL: ${context.raw} TUL`;
            return `Jam Lembur: ${context.raw} Jam`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(67, 139, 196, 0.1)' },
        ticks: { color: '#FFF8E7', font: { size: 12, family: 'Inter', weight: '700' } }
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        ticks: { color: '#8CC1E9', font: { size: 11, weight: '700' }, callback: v => `${v}h` },
        grid: { color: 'rgba(67, 139, 196, 0.12)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        ticks: { color: '#fbbf24', font: { size: 11, weight: '700' }, callback: v => `${v} TUL` },
        grid: { drawOnChartArea: false }
      }
    }
  };

  // Plant Share Donut Chart Data
  const totalPlantHoursAll = plantStats.reduce((sum, p) => sum + p.totalHours, 0) || 1;
  const plantShareData = {
    labels: plantStats.map(p => p.label),
    datasets: [
      {
        data: plantStats.map(p => p.totalHours || 1),
        backgroundColor: plantStats.map(p => p.color),
        borderColor: '#091a38',
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const plantShareOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#FFF8E7',
          font: { size: 11, family: 'Inter', weight: '700' },
          boxWidth: 10,
          padding: 8
        }
      },
      tooltip: {
        backgroundColor: '#091a38',
        borderColor: '#00d2ff',
        borderWidth: 1,
        titleColor: '#8CC1E9',
        bodyColor: '#FFF8E7',
        callbacks: {
          label: (context) => {
            const val = context.raw;
            const pct = Math.round((val / totalPlantHoursAll) * 100);
            return ` ${context.label}: ${val} Jam (${pct}%)`;
          }
        }
      }
    },
    cutout: '68%'
  };

  // -------------------------------------------------------------
  // 1. Chart Bulanan Data & Options (Global All Plants: Januari -> Bulan Berjalan)
  // -------------------------------------------------------------
  const allIndonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentMonthIndex = new Date().getMonth();

  const displayMonths = useMemo(() => {
    if (selectedMonths && selectedMonths.length > 0) {
      const selectedNames = selectedMonths.map(m => m.split(' ')[0].toLowerCase());
      const matched = allIndonesianMonths.filter(m => selectedNames.includes(m.toLowerCase()));
      if (matched.length > 0) return matched;
    }
    return allIndonesianMonths.slice(0, currentMonthIndex + 1);
  }, [selectedMonths, currentMonthIndex]);

  const { bulananHours, bulananTUL } = useMemo(() => {
    const hours = [];
    const tuls = [];

    displayMonths.forEach((mName) => {
      const mIndex = allIndonesianMonths.findIndex(m => m.toLowerCase() === mName.toLowerCase());
      const records = filteredRecords.filter(r => {
        if (r.month && r.month.toLowerCase().startsWith(mName.toLowerCase())) {
          return true;
        }
        if (r.tglOvertime) {
          const parts = r.tglOvertime.split('-');
          if (parts.length >= 2) {
            return Number(parts[1]) === (mIndex + 1);
          }
        }
        return false;
      });

      const h = records.reduce((sum, r) => sum + (Number(r.jamOvertime) || 0), 0);
      const t = records.reduce((sum, r) => sum + (Number(r.totalTUL) || calculateTUL(Number(r.jamOvertime) || 0, r.isHoliday)), 0);
      hours.push(Math.round(h * 10) / 10);
      tuls.push(Math.round(t * 10) / 10);
    });

    return { bulananHours: hours, bulananTUL: tuls };
  }, [displayMonths, filteredRecords, calculateTUL]);

  const bulananChartData = {
    labels: displayMonths,
    datasets: [
      {
        type: 'bar',
        label: 'JAM OVERTIME',
        data: bulananHours,
        backgroundColor: '#0088ff',
        hoverBackgroundColor: '#00d2ff',
        borderColor: '#8CC1E9',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.45,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line',
        label: 'TOTAL TUL',
        data: bulananTUL,
        borderColor: '#fbbf24',
        backgroundColor: '#fbbf24',
        borderWidth: 2.5,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#091a38',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      }
    ]
  };

  const bulananChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#091a38',
        borderColor: '#fbbf24',
        borderWidth: 1,
        titleColor: '#8CC1E9',
        bodyColor: '#FFF8E7',
        padding: 9,
        callbacks: {
          label: (context) => {
            if (context.dataset.yAxisID === 'y1') return `Total TUL: ${context.raw} TUL`;
            return `Jam OT: ${context.raw} Jam`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(67, 139, 196, 0.1)' },
        ticks: { color: '#FFF8E7', font: { size: 12, family: 'Inter', weight: '700' } }
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        ticks: { color: '#8CC1E9', callback: (v) => `${v}h`, font: { size: 11, weight: '700' } },
        grid: { color: 'rgba(67, 139, 196, 0.12)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        ticks: { color: '#fbbf24', callback: (v) => `${v} TUL`, font: { size: 11, weight: '700' } },
        grid: { drawOnChartArea: false }
      }
    }
  };

  // -------------------------------------------------------------
  // 2. Chart Mingguan Data & Options (Global All Plants)
  // -------------------------------------------------------------
  const weeklyLabels = ['W1', 'W2', 'W3', 'W4'];
  const { mingguanHours, mingguanTUL } = useMemo(() => {
    const weeks = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: 31 }
    ];
    const hours = [];
    const tuls = [];

    weeks.forEach(w => {
      const records = filteredRecords.filter(r => {
        const d = r.day ? Number(r.day) : (r.tglOvertime ? Number(r.tglOvertime.split('-')[2]) : null);
        return d >= w.start && d <= w.end;
      });
      const h = records.reduce((sum, r) => sum + (Number(r.jamOvertime) || 0), 0);
      const t = records.reduce((sum, r) => sum + (Number(r.totalTUL) || calculateTUL(Number(r.jamOvertime) || 0, r.isHoliday)), 0);
      hours.push(Math.round(h * 10) / 10);
      tuls.push(Math.round(t * 10) / 10);
    });

    return { mingguanHours: hours, mingguanTUL: tuls };
  }, [filteredRecords, calculateTUL]);

  const mingguanChartData = {
    labels: weeklyLabels,
    datasets: [
      {
        type: 'bar',
        label: 'JAM OVERTIME',
        data: mingguanHours,
        backgroundColor: '#0088ff',
        hoverBackgroundColor: '#00d2ff',
        borderColor: '#8CC1E9',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.45,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line',
        label: 'TOTAL TUL',
        data: mingguanTUL,
        borderColor: '#fbbf24',
        backgroundColor: '#fbbf24',
        borderWidth: 2.5,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#091a38',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      }
    ]
  };

  const mingguanChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#091a38',
        borderColor: '#fbbf24',
        borderWidth: 1,
        titleColor: '#8CC1E9',
        bodyColor: '#FFF8E7',
        padding: 9,
        callbacks: {
          label: (context) => {
            if (context.dataset.yAxisID === 'y1') return `Total TUL: ${context.raw} TUL`;
            return `Jam OT: ${context.raw} Jam`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(67, 139, 196, 0.1)' },
        ticks: { color: '#FFF8E7', font: { size: 12, family: 'Inter', weight: '700' } }
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        ticks: { color: '#8CC1E9', stepSize: 100, callback: (v) => `${v}h`, font: { size: 11, weight: '700' } },
        grid: { color: 'rgba(67, 139, 196, 0.12)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        ticks: { color: '#fbbf24', stepSize: 150, callback: (v) => `${v} TUL`, font: { size: 11, weight: '700' } },
        grid: { drawOnChartArea: false }
      }
    }
  };

  // -------------------------------------------------------------
  // 3. Chart Harian Data & Options (Global All Plants Dinamis s/d Hari Ini / Filter Tanggal)
  // -------------------------------------------------------------
  const currentDay = new Date().getDate();
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const activeMonthShort = useMemo(() => {
    if (selectedMonths && selectedMonths.length === 1) {
      return selectedMonths[0].split(' ')[0].slice(0, 3);
    }
    return monthsShort[new Date().getMonth()];
  }, [selectedMonths, monthsShort]);

  const activeDateRangeLabel = useMemo(() => {
    const monthStr = selectedMonths && selectedMonths.length === 1 ? selectedMonths[0] : `${activeMonthShort} ${new Date().getFullYear()}`;
    const mShort = monthStr.split(' ')[0].slice(0, 3);
    if (selectedDays && selectedDays.length > 0) {
      const sorted = [...selectedDays].map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
      if (sorted.length === 1) {
        return `${String(sorted[0]).padStart(2, '0')} ${mShort}`;
      } else if (sorted.length > 1) {
        return `${String(sorted[0]).padStart(2, '0')} ${mShort} - ${String(sorted[sorted.length - 1]).padStart(2, '0')} ${mShort}`;
      }
    }
    const endDayStr = String(currentDay).padStart(2, '0');
    return `01 ${mShort} - ${endDayStr} ${mShort}`;
  }, [selectedMonths, selectedDays, currentDay, activeMonthShort]);

  const displayDays = useMemo(() => {
    if (selectedDays && selectedDays.length > 0) {
      const nums = selectedDays.map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
      if (nums.length > 0) return nums;
    }
    return Array.from({ length: currentDay }, (_, i) => i + 1);
  }, [selectedDays, currentDay]);

  const { dailyDateLabels, dailyHours, dailyTUL } = useMemo(() => {
    const labels = displayDays.map(d => `${String(d).padStart(2, '0')} ${activeMonthShort}`);
    const hours = [];
    const tuls = [];

    displayDays.forEach(d => {
      const records = filteredRecords.filter(r => {
        const recDay = r.day ? Number(r.day) : (r.tglOvertime ? Number(r.tglOvertime.split('-')[2]) : null);
        return recDay === d;
      });
      const h = records.reduce((sum, r) => sum + (Number(r.jamOvertime) || 0), 0);
      const t = records.reduce((sum, r) => sum + (Number(r.totalTUL) || calculateTUL(Number(r.jamOvertime) || 0, r.isHoliday)), 0);
      hours.push(Math.round(h * 10) / 10);
      tuls.push(Math.round(t * 10) / 10);
    });

    return { dailyDateLabels: labels, dailyHours: hours, dailyTUL: tuls };
  }, [displayDays, activeMonthShort, filteredRecords, calculateTUL]);

  const dailyChartData = {
    labels: dailyDateLabels,
    datasets: [
      {
        type: 'bar',
        label: 'JAM OVERTIME',
        data: dailyHours,
        backgroundColor: '#0088ff',
        hoverBackgroundColor: '#00d2ff',
        borderColor: '#8CC1E9',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.5,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line',
        label: 'TOTAL TUL',
        data: dailyTUL,
        borderColor: '#fbbf24',
        backgroundColor: '#fbbf24',
        borderWidth: 2.5,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#091a38',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      }
    ]
  };

  const dailyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#091a38',
        borderColor: '#fbbf24',
        borderWidth: 1,
        titleColor: '#8CC1E9',
        bodyColor: '#FFF8E7',
        padding: 9,
        callbacks: {
          label: (context) => {
            if (context.dataset.yAxisID === 'y1') return `Total TUL: ${context.raw} TUL`;
            return `Jam OT: ${context.raw} Jam`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(67, 139, 196, 0.1)' },
        ticks: { color: '#FFF8E7', font: { size: 11.5, family: 'Inter', weight: '700' } }
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        ticks: { color: '#8CC1E9', stepSize: 20, callback: (v) => `${v}h`, font: { size: 11, weight: '700' } },
        grid: { color: 'rgba(67, 139, 196, 0.12)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        ticks: { color: '#fbbf24', stepSize: 30, callback: (v) => `${v} TUL`, font: { size: 11, weight: '700' } },
        grid: { drawOnChartArea: false }
      }
    }
  };

  // -------------------------------------------------------------
  // 4. Chart Pareto Top 10 Overtime Karyawan (Global Seluruh Plant)
  // -------------------------------------------------------------
  const employeeOvertimeMap = {};
  filteredRecords.forEach(r => {
    const hrs = Number(r.jamOvertime) || 0;
    const tul = r.totalTUL !== undefined && r.totalTUL !== null ? Number(r.totalTUL) : calculateTUL(hrs, r.isHoliday);
    if (!employeeOvertimeMap[r.npk]) {
      employeeOvertimeMap[r.npk] = {
        npk: r.npk,
        nama: r.nama || r.npk,
        plant: r.plant || 'Plant Molded',
        shift: r.shift || 'Shift 1',
        totalHours: 0,
        totalTUL: 0,
        count: 0
      };
    }
    employeeOvertimeMap[r.npk].totalHours += hrs;
    employeeOvertimeMap[r.npk].totalTUL += tul;
    employeeOvertimeMap[r.npk].count += 1;
  });

  const sortedEmployees = Object.values(employeeOvertimeMap)
    .filter(e => e.totalHours > 0)
    .sort((a, b) => b.totalHours - a.totalHours || b.totalTUL - a.totalTUL)
    .slice(0, 10);

  const top10Labels = sortedEmployees.map(e => e.nama);
  const top10Hours = sortedEmployees.map(e => Math.round(e.totalHours * 10) / 10);
  const top10TUL = sortedEmployees.map(e => Math.round(e.totalTUL * 10) / 10);

  const maxTopHours = top10Hours.length > 0 ? Math.max(...top10Hours) : 8;
  const computedYMax = Math.max(10, Math.ceil((maxTopHours + 2) / 2) * 2);
  const numSteps = computedYMax / 2;
  const computedY1Max = numSteps * 4;

  const paretoChartData = {
    labels: top10Labels,
    datasets: [
      {
        type: 'bar',
        label: 'JAM LEMBUR',
        data: top10Hours,
        backgroundColor: '#0088ff',
        hoverBackgroundColor: '#00d2ff',
        borderColor: '#8CC1E9',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.5,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line',
        label: 'TOTAL TUL',
        data: top10TUL,
        borderColor: '#fbbf24',
        backgroundColor: '#fbbf24',
        borderWidth: 2.5,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#091a38',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      }
    ]
  };

  const paretoChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#091a38',
        borderColor: '#fbbf24',
        borderWidth: 1,
        titleColor: '#8CC1E9',
        bodyColor: '#FFF8E7',
        callbacks: {
          label: (context) => {
            if (context.dataset.yAxisID === 'y1') return `TUL: ${context.raw}`;
            return `Jam Lembur: ${context.raw} Jam`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#FFF8E7',
          font: { size: 11, family: 'Inter', weight: '700' },
          maxRotation: 35,
          minRotation: 0,
          autoSkip: false
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: computedYMax,
        ticks: { color: '#8CC1E9', font: { size: 11, weight: '700' }, stepSize: 2 },
        grid: { color: 'rgba(67, 139, 196, 0.12)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: computedY1Max,
        ticks: { color: '#fbbf24', font: { size: 11, weight: '700' }, stepSize: 4 },
        grid: { drawOnChartArea: false }
      }
    }
  };

  // -------------------------------------------------------------
  // 5. Chart Distribusi Shift (Global All Plants)
  // -------------------------------------------------------------
  const shiftCounts = { 'Shift 1': 0, 'Shift 2': 0 };
  const shiftTULCounts = { 'Shift 1': 0, 'Shift 2': 0 };

  filteredRecords.forEach(r => {
    const hrs = Number(r.jamOvertime) || 0;
    const tul = r.totalTUL !== undefined && r.totalTUL !== null ? Number(r.totalTUL) : calculateTUL(hrs, r.isHoliday);
    if (shiftCounts[r.shift] !== undefined) {
      shiftCounts[r.shift] += hrs;
      shiftTULCounts[r.shift] += tul;
    }
  });

  const totalShiftHours = shiftCounts['Shift 1'] + shiftCounts['Shift 2'];
  const shift1Pct = totalShiftHours > 0 ? Math.round((shiftCounts['Shift 1'] / totalShiftHours) * 100) : 0;
  const shift2Pct = totalShiftHours > 0 ? 100 - shift1Pct : 0;

  const shiftChartData = {
    labels: ['Shift 1', 'Shift 2'],
    datasets: [
      {
        data: [shiftCounts['Shift 1'], shiftCounts['Shift 2']],
        backgroundColor: ['#0088ff', '#fbbf24'],
        hoverBackgroundColor: ['#00d2ff', '#fde68a'],
        borderWidth: 2,
        borderColor: '#091a38'
      }
    ]
  };

  const shiftChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#091a38',
        borderColor: '#00d2ff',
        borderWidth: 1,
        titleColor: '#8CC1E9',
        bodyColor: '#FFF8E7',
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} Jam`
        }
      }
    },
    cutout: '72%'
  };

  // Filter Items (Dinamis sampai hari ini)
  const dayItems = useMemo(() => {
    const todayNum = new Date().getDate();
    return Array.from({ length: todayNum }, (_, i) => {
      const d = todayNum - i;
      return { value: String(d), label: `Tanggal ${d}` };
    });
  }, []);

  const shiftItems = shifts.map(s => ({ value: s, label: s }));

  const plantItems = plants.map(p => ({ value: p.name, label: p.name }));

  const employeeItems = employees.map(emp => ({ value: emp.npk, label: `${emp.name} (${emp.npk})` }));

  // Live Digital Clock
  const [liveDateTime, setLiveDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const date = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setLiveDateTime(`${date} ${month} ${year}  ${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-content" style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 1. TOP EXECUTIVE HERO BANNER */}
      <div className="dashboard-hero-mockup-card" style={{ marginBottom: 0 }}>
        <div className="hero-mockup-left">
          <div className="hero-glowing-icon">
            <Globe size={22} color="#ffffff" />
          </div>
          <div className="hero-text-block">
            <div className="hero-dept-tag">QUALITY CONTROL</div>
            <h1 className="hero-main-title">Dashboard Overtime All Plants</h1>
            <p className="hero-desc">
              Monitoring dan analisis komparasi lembur seluruh plant (Hose, Molded, Subcont, Mixing, RVI).
            </p>
          </div>
        </div>

        {/* Live Status Card */}
        <div className="hero-live-status-card">
          <div className="hero-live-clock-icon">
            <Clock size={15} />
          </div>
          <div className="hero-status-texts">
            <span className="hero-status-label">Waktu Sistem</span>
            <span className="hero-status-time">{liveDateTime}</span>
          </div>
        </div>
      </div>

      {/* 2. FILTER PARAMETER CONTROL BAR */}
      <div className="filter-parameter-mockup-card" style={{ marginBottom: 0 }}>
        <div className="filter-parameter-top-row">
          <div className="filter-parameter-title-group">
            <FilterIcon size={15} color="#38bdf8" />
            <span className="filter-param-header-text">Filter Parameter</span>
            <span className="filter-live-pill">All Plants</span>
          </div>

          <div className="filter-parameter-actions">
            <button
              type="button"
              className="btn-filter-reset"
              onClick={handleResetFilters}
              title="Reset Semua Kriteria Filter"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 5-Column Filter Parameter Grid */}
        <div className="filter-boxes-grid">
          {/* Box 1: BULAN */}
          <FilterPopover
            title="PILIH BULAN"
            label="Bulan"
            icon={<Calendar size={15} color="#38bdf8" />}
            items={monthList}
            selectedValues={selectedMonths}
            onChange={setSelectedMonths}
            displayValue={
              selectedMonths.length === 0 || selectedMonths.length === monthList.length
                ? 'Semua Bulan'
                : selectedMonths.length === 1
                ? selectedMonths[0]
                : `${selectedMonths.length} Bulan`
            }
          />

          {/* Box 2: TANGGAL */}
          <FilterPopover
            title="PILIH TANGGAL"
            label="Tanggal"
            icon={<Calendar size={15} color="#38bdf8" />}
            items={dayItems}
            selectedValues={selectedDays}
            onChange={setSelectedDays}
            displayValue={
              selectedDays.length === 0 || selectedDays.length === dayItems.length
                ? 'Semua Tanggal'
                : selectedDays.length === 1
                ? `Tanggal ${selectedDays[0]}`
                : `Tanggal ${selectedDays.join(', ')}`
            }
          />

          {/* Box 3: SHIFT */}
          <FilterPopover
            title="PILIH SHIFT"
            label="Shift"
            icon={<Users size={15} color="#38bdf8" />}
            items={shiftItems}
            selectedValues={selectedShifts}
            onChange={setSelectedShifts}
            displayValue={(() => {
              const active = selectedShifts.filter(s => s !== 'Semua' && s !== 'all');
              if (active.length === 0 || active.length === shiftItems.length) return `${shiftItems.length} Shift Terpilih`;
              if (active.length === 1) return active[0];
              return `${active.length} Shift Terpilih`;
            })()}
          />

          {/* Box 4: PLANT */}
          <FilterPopover
            title="PILIH PLANT"
            label="Plant"
            icon={<Building2 size={15} color="#38bdf8" />}
            items={plantItems}
            selectedValues={selectedPlants}
            onChange={setSelectedPlants}
            displayValue={(() => {
              const active = selectedPlants.filter(p => p !== 'Semua' && p !== 'all');
              if (active.length === 0 || active.length === plantItems.length) return `${plantItems.length} Plant Terpilih`;
              if (active.length === 1) return active[0];
              return `${active.length} Plant Terpilih`;
            })()}
          />

          {/* Box 5: KARYAWAN */}
          <FilterPopover
            title="PILIH KARYAWAN"
            label="Karyawan"
            icon={<Users size={15} color="#38bdf8" />}
            items={employeeItems}
            selectedValues={selectedEmployees}
            onChange={setSelectedEmployees}
            width={280}
            align="right"
            displayValue={(() => {
              const active = selectedEmployees.filter(e => e !== 'Semua' && e !== 'all');
              if (active.length === 0 || active.length === employeeItems.length) return 'Semua Karyawan';
              if (active.length === 1) return employeeItems.find(e => e.value === active[0])?.label || active[0];
              return `${active.length} Terpilih`;
            })()}
          />
        </div>
      </div>

      {/* 3. TOP 2 EXECUTIVE GLOBAL KPI CARDS */}
      <div className="kpi-metric-mockup-grid" style={{ marginBottom: 0 }}>

        {/* Metric 1: Total Jam Lembur All Plants */}
        <div className="kpi-mockup-card kpi-card-blue">
          <div className="kpi-header-row">
            <div className="kpi-icon-square">
              <Clock size={15} color="#38bdf8" />
            </div>
            <span className="kpi-card-title">TOTAL JAM OVERTIME (ALL)</span>
          </div>

          <div className="kpi-body-row">
            <div className="kpi-main-number-block">
              <span className="kpi-main-number">{totalJamOvertime}</span>
              <span className="kpi-main-unit">Jam</span>
            </div>
          </div>

          <div className="kpi-footer-text">
            Agregasi seluruh plant QC
          </div>
        </div>

        {/* Metric 2: Karyawan Aktif Lembur */}
        <div className="kpi-mockup-card kpi-card-amber">
          <div className="kpi-header-row">
            <div className="kpi-icon-square" style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
              <Users size={15} color="#fbbf24" />
            </div>
            <span className="kpi-card-title">KARYAWAN AKTIF LEMBUR</span>
          </div>

          <div className="kpi-body-row">
            <div className="kpi-main-number-block">
              <span className="kpi-main-number">{uniqueEmployees}</span>
              <span className="kpi-main-unit">Orang</span>
            </div>
          </div>

          <div className="kpi-footer-text">
            Personel QC lembur tercatat
          </div>
        </div>

      </div>

      {/* 4. 5 PLANT OVERVIEW & NAVIGATION CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              Ringkasan Overtime Per Plant
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Pilih plant untuk melihat detail
          </span>
        </div>

        <div className="all-plants-grid">
          {plantStats.map(p => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="plant-overview-card"
                onClick={() => setCurrentView(p.id)}
              >
                {/* Header */}
                <div className="plant-card-header">
                  <div className="plant-card-icon" style={{ backgroundColor: `${p.color}18`, borderColor: `${p.color}40`, color: p.color }}>
                    <Icon size={16} />
                  </div>
                  <div className="plant-card-title-group">
                    <span className="plant-card-name">{p.name}</span>
                  </div>
                  <ChevronRight size={14} color="#64748b" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </div>

                {/* Metrics */}
                <div className="plant-card-metrics">
                  <div className="plant-metric-item">
                    <span className="plant-metric-label">Jam Lembur</span>
                    <span className="plant-metric-val">
                      {p.totalHours} <small>Jam</small>
                    </span>
                  </div>
                  <div className="plant-metric-item">
                    <span className="plant-metric-label">Total TUL</span>
                    <span className="plant-metric-val" style={{ color: '#fbbf24' }}>
                      {p.totalTUL} <small style={{ color: '#94a3b8' }}>TUL</small>
                    </span>
                  </div>
                  <div className="plant-metric-item">
                    <span className="plant-metric-label">Karyawan</span>
                    <span className="plant-metric-val" style={{ color: '#34d399' }}>
                      {p.totalEmps} <small style={{ color: '#94a3b8' }}>Org</small>
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="plant-card-footer">
                  <span className="plant-shift-breakdown">
                    S1: <strong>{p.shift1Hours}h</strong> • S2: <strong>{p.shift2Hours}h</strong>
                  </span>
                  <div className="plant-goto-btn">
                    <span>Lihat</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. PLANT COMPARISON CHARTS SECTION */}
      <div className="plant-comparison-row">

        {/* Bar Comparison Chart */}
        <div className="chart-card plant-comparison-chart-card" style={{ padding: '16px 20px', minHeight: 310 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0, 85, 160, 0.35)', border: '1px solid rgba(140, 193, 233, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={15} color="#00d2ff" />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.02em' }}>
                KOMPARASI JAM LEMBUR & TUL ANTAR PLANT
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(10, 22, 45, 0.7)', padding: '3px 7px', borderRadius: 4, border: '1px solid rgba(67, 139, 196, 0.35)' }}>
                <span style={{ width: 8, height: 8, background: '#0088ff', display: 'inline-block', borderRadius: 2 }} />
                <span style={{ color: '#FFF8E7', fontWeight: 700 }}>JAM LEMBUR</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(10, 22, 45, 0.7)', padding: '3px 7px', borderRadius: 4, border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                <span style={{ width: 10, height: 2.5, background: '#fbbf24', display: 'inline-block', borderRadius: 2 }} />
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>TUL</span>
              </div>
            </div>
          </div>

          <div className="chart-canvas-wrapper" style={{ flex: 1, minHeight: 240 }}>
            <Bar
              data={plantComparisonData}
              options={plantComparisonOptions}
              plugins={[lineDatalabelsPlugin]}
            />
          </div>
        </div>
      </div>

      {/* 6. MAIN 2-COLUMN LAYOUT: 3 BOXES LEFT + 2 BOXES RIGHT */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.18fr 0.82fr',
          gap: 16,
          alignItems: 'stretch'
        }}
        className="dashboard-analytics-split-layout"
      >

        {/* === SISI KIRI (3 KOTAK SEJAJAR KE BAWAH) === */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', gap: 16, height: '100%' }}>

          {/* KOTAK 1 KIRI: TREN OVERTIME BULANAN */}
          <div className="chart-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0, 85, 160, 0.35)', border: '1px solid rgba(140, 193, 233, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={15} color="#00d2ff" />
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.02em' }}>
                  TREN OVERTIME BULANAN (ALL PLANTS)
                </span>
              </div>

              {/* Legends */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(10, 22, 45, 0.7)', padding: '4px 9px', borderRadius: 4, border: '1px solid rgba(67, 139, 196, 0.35)' }}>
                  <span style={{ width: 9, height: 9, background: '#0088ff', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: '#FFF8E7', fontWeight: 700 }}>JAM OT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(10, 22, 45, 0.7)', padding: '4px 9px', borderRadius: 4, border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                  <span style={{ width: 11, height: 3, background: '#fbbf24', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>TUL</span>
                </div>
              </div>
            </div>

            {/* Bulanan Chart with Left Capsule */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', width: '100%' }}>
              <div
                style={{
                  width: 36,
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginRight: 12,
                  background: 'linear-gradient(180deg, rgba(0, 85, 160, 0.5) 0%, rgba(10, 22, 45, 0.95) 100%)',
                  border: '1px solid rgba(67, 139, 196, 0.4)',
                  borderRadius: 8,
                  padding: '3px'
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: '#091a38',
                    borderLeft: '3px solid #0088ff',
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 2px'
                  }}
                >
                  <span
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      letterSpacing: '0.2em',
                      color: '#8CC1E9',
                      textTransform: 'uppercase',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    BULANAN
                  </span>
                </div>
              </div>

              <div className="chart-canvas-wrapper" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Bar data={bulananChartData} options={bulananChartOptions} plugins={[lineDatalabelsPlugin]} />
              </div>
            </div>
          </div>

          {/* KOTAK 2 KIRI: TREN OVERTIME MINGGUAN */}
          <div className="chart-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 85, 160, 0.35)', border: '1px solid rgba(140, 193, 233, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={17} color="#00d2ff" />
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.02em' }}>
                  TREN OVERTIME MINGGUAN (ALL PLANTS)
                </span>
                <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0, 229, 255, 0.15)', color: '#00d2ff', fontWeight: 700 }}>
                  W1 - W4
                </span>
              </div>

              {/* Legends */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(10, 22, 45, 0.7)', padding: '4px 9px', borderRadius: 4, border: '1px solid rgba(67, 139, 196, 0.35)' }}>
                  <span style={{ width: 9, height: 9, background: '#0088ff', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: '#FFF8E7', fontWeight: 700 }}>JAM OT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(10, 22, 45, 0.7)', padding: '4px 9px', borderRadius: 4, border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                  <span style={{ width: 11, height: 3, background: '#fbbf24', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>TUL</span>
                </div>
              </div>
            </div>

            {/* Mingguan Chart with Left Capsule */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', width: '100%' }}>
              <div
                style={{
                  width: 36,
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginRight: 12,
                  background: 'linear-gradient(180deg, rgba(0, 85, 160, 0.5) 0%, rgba(10, 22, 45, 0.95) 100%)',
                  border: '1px solid rgba(67, 139, 196, 0.4)',
                  borderRadius: 8,
                  padding: '3px'
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: '#091a38',
                    borderLeft: '3px solid #00e5ff',
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 2px'
                  }}
                >
                  <span
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      letterSpacing: '0.2em',
                      color: '#8CC1E9',
                      textTransform: 'uppercase',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    MINGGUAN
                  </span>
                </div>
              </div>

              <div className="chart-canvas-wrapper" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Bar data={mingguanChartData} options={mingguanChartOptions} plugins={[lineDatalabelsPlugin]} />
              </div>
            </div>
          </div>

          {/* KOTAK 3 KIRI: TREN OVERTIME HARIAN */}
          <div className="chart-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 85, 160, 0.35)', border: '1px solid rgba(140, 193, 233, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={17} color="#00d2ff" />
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.02em' }}>
                  TREN OVERTIME HARIAN (ALL PLANTS)
                </span>
                <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0, 85, 160, 0.25)', color: '#8CC1E9', fontWeight: 700 }}>
                  {activeDateRangeLabel}
                </span>
              </div>

              {/* Legends */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(10, 22, 45, 0.7)', padding: '4px 9px', borderRadius: 4, border: '1px solid rgba(67, 139, 196, 0.35)' }}>
                  <span style={{ width: 9, height: 9, background: '#0088ff', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: '#FFF8E7', fontWeight: 700 }}>JAM OT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(10, 22, 45, 0.7)', padding: '4px 9px', borderRadius: 4, border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                  <span style={{ width: 11, height: 3, background: '#fbbf24', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>TUL</span>
                </div>
              </div>
            </div>

            {/* Harian Chart with Left Capsule */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', width: '100%' }}>
              <div
                style={{
                  width: 36,
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginRight: 12,
                  background: 'linear-gradient(180deg, rgba(0, 85, 160, 0.5) 0%, rgba(10, 22, 45, 0.95) 100%)',
                  border: '1px solid rgba(67, 139, 196, 0.4)',
                  borderRadius: 8,
                  padding: '3px'
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: '#091a38',
                    borderLeft: '3px solid #0088ff',
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 2px'
                  }}
                >
                  <span
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      letterSpacing: '0.2em',
                      color: '#8CC1E9',
                      textTransform: 'uppercase',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    HARIAN
                  </span>
                </div>
              </div>

              <div className="chart-canvas-wrapper" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Bar data={dailyChartData} options={dailyChartOptions} plugins={[lineDatalabelsPlugin]} />
              </div>
            </div>
          </div>

        </div>

        {/* === SISI KANAN (2 KOTAK SEJAJAR KE BAWAH: TOP 10 & DISTRIBUSI SHIFT DENGAN UKURAN PERSIS SAMA 50%-50%) === */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16, height: '100%' }}>

          {/* KOTAK 1 KANAN: TOP 10 OVERTIME KARYAWAN (PARETO LEADERBOARD) */}
          <div className="chart-card" style={{ padding: '18px 20px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div className="chart-card-header" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span className="chart-title" style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 85, 160, 0.35)', border: '1px solid rgba(67, 139, 196, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={17} color="#00d2ff" />
                </div>
                TOP 10 OVERTIME KARYAWAN (ALL PLANTS)
              </span>
            </div>

            <div className="chart-canvas-wrapper" style={{ flex: 1, minHeight: 0, position: 'relative', width: '100%' }}>
              <Bar data={paretoChartData} options={paretoChartOptions} plugins={[lineDatalabelsPlugin]} />
            </div>
          </div>

          {/* KOTAK 2 KANAN: PENCAPAIAN & DISTRIBUSI OVERTIME PER SHIFT */}
          <div className="chart-card" style={{ padding: '18px 20px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div className="chart-card-header" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span className="chart-title" style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 85, 160, 0.35)', border: '1px solid rgba(140, 193, 233, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PieIcon size={17} color="#00d2ff" />
                </div>
                DISTRIBUSI LEMBUR PER SHIFT (ALL PLANTS)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, justifyContent: 'space-between' }}>
              {/* Donut Canvas */}
              <div className="chart-canvas-wrapper" style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', maxHeight: 220 }}>
                  <Doughnut data={shiftChartData} options={shiftChartOptions} />
                </div>
              </div>

              {/* Shift Breakdown Detail Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
                {/* Shift 1 Card */}
                <div
                  style={{
                    background: 'rgba(0, 85, 160, 0.25)',
                    border: '2px solid rgba(0, 136, 255, 0.65)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#8CC1E9', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0088ff', display: 'inline-block' }} />
                      SHIFT 1
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFF8E7' }}>
                      {shift1Pct}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif' }}>
                      {shiftCounts['Shift 1']} <span style={{ fontSize: '0.85rem', color: '#8CC1E9' }}>Jam</span>
                    </span>
                    <span style={{ fontSize: '0.88rem', color: '#fbbf24', fontWeight: 700 }}>
                      {shiftTULCounts['Shift 1']} TUL
                    </span>
                  </div>
                </div>

                {/* Shift 2 Card */}
                <div
                  style={{
                    background: 'rgba(251, 191, 36, 0.12)',
                    border: '2px solid rgba(251, 191, 36, 0.55)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                      SHIFT 2
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFF8E7' }}>
                      {shift2Pct}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif' }}>
                      {shiftCounts['Shift 2']} <span style={{ fontSize: '0.85rem', color: '#8CC1E9' }}>Jam</span>
                    </span>
                    <span style={{ fontSize: '0.88rem', color: '#fbbf24', fontWeight: 700 }}>
                      {shiftTULCounts['Shift 2']} TUL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 7. BOTTOM INFORMATIONAL & MOTTO BANNER */}
      <div className="bottom-info-mockup-banner" style={{ marginTop: 0 }}>
        <div className="bottom-info-left">
          <div className="bottom-info-icon-box">
            <Volume2 size={16} color="#ffffff" />
          </div>
          <div className="bottom-info-text-wrap">
            <span className="bottom-info-title">Informasi All Plants</span>
            <span className="bottom-info-desc">
              Data lembur seluruh plant (Hose, Molded, Subcont, Mixing, RVI) telah terakumulasi secara real-time.
            </span>
          </div>
        </div>

        <div className="bottom-info-motto">
          — Quality Today, Better Tomorrow
        </div>
      </div>

    </div>
  );
};

export default DashboardAllPlants;
