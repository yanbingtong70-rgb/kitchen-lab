import React, { useState, useEffect } from 'react';
import { Scale, Timer, RotateCcw, Utensils, ChefHat, Trash2, Wheat, ScrollText, Power, Play, Pause, RefreshCw, X, Moon, Volume2, VolumeX } from 'lucide-react';

// --- 数据库 ---
const RECIPES = {
  "🍞 乡村面包 (75%)": 75,
  "🔰 新手入门 (65%)": 65,
  "☁️ 夏巴塔 (85%)": 85
};

const FOODS = {
  "🐔 鸡胸": { cal: 165, p: 31, c: 0, f: 3.6 },
  "🍚 米饭": { cal: 130, p: 2.7, c: 28, f: 0.3 },
  "🥚 鸡蛋": { cal: 155, p: 13, c: 1.1, f: 11 },
  "🥣 燕麦": { cal: 389, p: 16.9, c: 66, f: 6.9 },
  "🥦 西兰花": { cal: 34, p: 2.8, c: 7, f: 0.4 },
  "🥛 牛奶": { cal: 65, p: 3.3, c: 4.8, f: 3.6 },
  "🥩 牛肉": { cal: 250, p: 26, c: 0, f: 17 },
  "🥑 牛油果": { cal: 160, p: 2, c: 9, f: 15 }
};

// 默认配比常量
const YEAST_PCT = 1; // 酵母 1%
const SALT_PCT = 2;  // 盐 2%

// 模式常量定义
const MODE_HIDDEN = 0;
const MODE_DIET = 1;
const MODE_BREAD = 2;

export default function App() {
  // --- 状态管理 ---
  const [rawInput, setRawInput] = useState(0); // 模拟传感器读数
  const [tareOffset, setTareOffset] = useState(0);
  
  // 核心模式状态: 0=隐藏, 1=饮食, 2=面包
  const [modeIndex, setModeIndex] = useState(MODE_HIDDEN); 
  const [baseWeight, setBaseWeight] = useState(null);
  const [showTimerMenu, setShowTimerMenu] = useState(false); // 控制计时器菜单显示
  
  // 系统设置状态
  const [isPoweredOn, setIsPoweredOn] = useState(true); // 开关机状态
  const [isMuted, setIsMuted] = useState(false); // 静音状态
  
  // 计时器状态
  const [timerState, setTimerState] = useState("IDLE"); // IDLE, RUNNING, PAUSED, RINGING
  const [timerMode, setTimerMode] = useState("UP"); // UP, DOWN
  const [timerSeconds, setTimerSeconds] = useState(0); // 记录经过的秒数或剩余秒数
  const [timerInitial, setTimerInitial] = useState(0); // 倒计时的初始值

  // 业务数据状态
  const [recipe, setRecipe] = useState("🍞 乡村面包 (75%)");
  const [macros, setMacros] = useState({ cal: 0, p: 0, c: 0, f: 0 });
  const [lastAdded, setLastAdded] = useState(null); // 记录单次摄入

  // 提示信息 (Toast)
  const [toast, setToast] = useState(null);

  // 计算净重
  const netWeight = rawInput - tareOffset;

  // --- 计时器逻辑 ---
  useEffect(() => {
    let interval = null;
    if (timerState === "RUNNING" && isPoweredOn) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === "UP") {
            return prev + 1;
          } else {
            // DOWN
            if (prev <= 1) {
              setTimerState("RINGING");
              return 0;
            }
            return prev - 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState, timerMode, isPoweredOn]);

  // 显示 Toast 3秒后消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- 格式化时间 ---
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- 操作处理函数 ---
  const handleTare = () => {
    if (!isPoweredOn) return;
    setTareOffset(rawInput);
  };

  // 切换模式逻辑 (0 -> 1 -> 2 -> 0)
  const toggleMode = () => {
    if (!isPoweredOn) return;
    setModeIndex(prev => {
      const next = (prev + 1) % 3;
      return next;
    });
    setBaseWeight(null); // 切换模式重置基准
    setShowTimerMenu(false); // 切换模式时关闭计时器菜单
  };

  const toggleTimerMenu = () => {
    if (!isPoweredOn) return;
    setShowTimerMenu(prev => !prev);
  };

  // 系统功能函数
  const togglePower = () => {
    if (isPoweredOn) {
      // 关机
      setIsPoweredOn(false);
      showToast("正在关机...", "default");
    } else {
      // 开机
      setIsPoweredOn(true);
      setTareOffset(rawInput); // 开机自动归零
      showToast("系统启动中...", "success");
    }
  };

  const setStandby = () => {
    if (!isPoweredOn) return;
    showToast("待机时间已延长至 30 分钟");
  };

  const toggleMute = () => {
    if (!isPoweredOn) return;
    setIsMuted(prev => !prev);
    showToast(!isMuted ? "已开启静音模式" : "已恢复声音");
  };

  // 计时器控制
  const startCountUp = () => {
    if (timerState === "IDLE" || timerState === "RINGING") {
      setTimerMode("UP");
      setTimerSeconds(0);
    }
    setTimerState("RUNNING");
  };

  const pauseTimer = () => {
    setTimerState("PAUSED");
  };

  const resumeTimer = () => {
    setTimerState("RUNNING");
  };

  const resetTimer = () => {
    setTimerState("IDLE");
    setTimerSeconds(0);
  };

  const startCountdown = (minutes) => {
    setTimerMode("DOWN");
    setTimerInitial(minutes * 60);
    setTimerSeconds(minutes * 60);
    setTimerState("RUNNING");
  };

  const setBase = () => {
    if (netWeight > 0) {
      setBaseWeight(netWeight);
      showToast(`面粉基准已锁定: ${netWeight}g`);
    } else {
      showToast("错误: 请先放面粉", "error");
    }
  };

  const addFood = (name, val) => {
    if (netWeight > 0) {
      const factor = netWeight / 100;
      
      const addedCal = val.cal * factor;
      const addedP = val.p * factor;
      const addedC = val.c * factor;
      const addedF = val.f * factor;

      setMacros(prev => ({
        cal: prev.cal + addedCal,
        p: prev.p + addedP,
        c: prev.c + addedC,
        f: prev.f + addedF
      }));

      setLastAdded({
        name: name,
        weight: netWeight,
        cal: addedCal,
        p: addedP,
        c: addedC,
        f: addedF
      });

      showToast(`已添加 ${netWeight}g ${name}`);
      setTareOffset(rawInput);
    } else {
      showToast("错误: 请先放食物", "error");
    }
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
  };

  // --- 渲染逻辑 ---

  // 如果关机，渲染黑屏逻辑
  const renderOledContent = () => {
    if (!isPoweredOn) {
      return (
        <div className="flex items-center justify-center h-full w-full animate-out fade-out duration-1000">
           {/* 黑屏状态，什么都不显示，或者显示微弱的关机动画 */}
        </div>
      );
    }

    // 1. 计时器徽章
    let timerBadge;
    if (timerState === "RUNNING") {
      if (timerMode === "DOWN") {
        timerBadge = (
          <div className="px-3 py-1 rounded-md border border-orange-500 text-orange-500 font-bold font-mono animate-pulse">
            ⏳ -{formatTime(timerSeconds)}
          </div>
        );
      } else {
        timerBadge = (
          <div className="px-3 py-1 rounded-md border border-blue-500 text-blue-500 font-bold font-mono">
            ⏱️ {formatTime(timerSeconds)}
          </div>
        );
      }
    } else if (timerState === "PAUSED") {
       timerBadge = (
        <div className="px-3 py-1 rounded-md border border-gray-500 text-gray-500 font-bold font-mono">
          ⏸️ {formatTime(timerSeconds)}
        </div>
      );
    } else if (timerState === "RINGING") {
      timerBadge = (
        <div className="px-3 py-1 rounded-md bg-red-500 text-white font-bold animate-pulse">
          🔔 DONE
        </div>
      );
    } else {
      timerBadge = (
        <div className="px-3 py-1 rounded-md border border-gray-700 text-gray-400 font-mono">
          ⏱️ 00:00
        </div>
      );
    }

    // 2. 状态标签和电池
    let modeLabel = "STANDBY";
    if (modeIndex === MODE_DIET) modeLabel = "🥗 DIET CALC";
    if (modeIndex === MODE_BREAD) modeLabel = "🥖 BREAD MAKER";

    // 3. 副屏内容 (根据模式变化)
    let subScreen;

    if (modeIndex === MODE_HIDDEN) {
      // 隐藏模式：显示简单的 Ready
      subScreen = (
        <div className="flex justify-center items-end w-full mt-4 pt-3 border-t border-gray-800">
           <div className="text-gray-600 font-mono text-sm">READY</div>
        </div>
      );
    } else if (modeIndex === MODE_BREAD) {
      // 面包模式
      const targetPct = RECIPES[recipe];
      let guideText = "等待设定基准 (Set Base)";
      let pctText = "--.-%";
      let guideColor = "#666";
      let valColor = "#444";

      if (baseWeight) {
        const currPct = (netWeight / baseWeight) * 100;
        const targetWater = Math.round(baseWeight * (targetPct / 100));
        
        guideColor = "#00ff00"; 
        valColor = "#00e5ff"; 
        pctText = `${currPct.toFixed(1)}%`;

        if (netWeight < targetWater * 0.1) {
          guideText = `🎯 目标水量: ${targetWater}g`;
        } else if (Math.abs(netWeight - targetWater) < 5) {
          guideText = "✅ 水量完美";
          valColor = "#00ff00";
        } else if (netWeight > targetWater) {
           guideText = `⚠️ 水量过多: +${netWeight - targetWater}g`;
           valColor = "#ff453a";
           guideColor = "#ff453a";
        } else {
          guideText = `Target Water: ${targetWater}g`;
        }
      }

      subScreen = (
        <div className="flex justify-between items-end w-full mt-4 pt-3 border-t border-gray-800">
          <div className="text-sm font-sans" style={{ color: guideColor }}>{guideText}</div>
          <div className="text-3xl font-bold font-mono" style={{ color: valColor }}>{pctText}</div>
        </div>
      );
    } else if (modeIndex === MODE_DIET) {
      // 饮食模式
      subScreen = (
        <div className="w-full mt-4 pt-3 border-t border-gray-800">
          <div className="flex justify-between">
            {/* 左侧：累计总量 */}
            <div className="flex flex-col items-start">
               <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Total Daily</div>
               <div className="text-2xl font-bold font-sans text-orange-500">
                  {Math.round(macros.cal)} <span className="text-sm text-gray-500">kcal</span>
               </div>
               <div className="text-[10px] text-gray-400 font-mono mt-1">
                  P:{Math.round(macros.p)} C:{Math.round(macros.c)} F:{Math.round(macros.f)}
               </div>
            </div>

            {/* 右侧：单次添加 */}
            <div className="flex flex-col items-end border-l border-gray-800 pl-4">
               <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Last Added</div>
               {lastAdded ? (
                 <>
                  <div className="text-xl font-bold font-sans text-green-400">
                      +{Math.round(lastAdded.cal)} <span className="text-xs text-gray-500">kcal</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-1 text-right">
                     P:{Math.round(lastAdded.p)} C:{Math.round(lastAdded.c)} F:{Math.round(lastAdded.f)}
                  </div>
                  <div className="text-[10px] text-green-600/70 mt-1 font-sans text-right">
                     {lastAdded.name.split(' ')[1]} {lastAdded.weight}g
                  </div>
                 </>
               ) : (
                  <div className="text-xl font-bold text-gray-800">--</div>
               )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* 状态栏 */}
        <div className="flex justify-between items-start mb-2 text-sm text-gray-500 border-b border-gray-800 pb-2">
          {timerBadge}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              {isMuted && <VolumeX size={12} className="text-gray-600" />}
              <span className="text-xs uppercase tracking-wider mb-1 transition-all duration-300">
                 {modeLabel}
              </span>
            </div>
            <span className="text-[10px] text-green-500">🔋 100%</span>
          </div>
        </div>

        {/* 重量显示 */}
        <div className="text-right">
          <div className="text-[5rem] font-bold leading-none tracking-tighter text-white">
            {netWeight} <span className="text-2xl text-gray-600 font-normal">g</span>
          </div>
        </div>

        {/* 副屏区域 */}
        {subScreen}
      </>
    );
  };

  // 计算配比卡片
  let recipeCard = null;
  if (isPoweredOn && modeIndex === MODE_BREAD && baseWeight) {
    const targetPct = RECIPES[recipe];
    const waterW = Math.round(baseWeight * (targetPct / 100));
    const yeastW = Math.round(baseWeight * (YEAST_PCT / 100));
    const saltW = Math.round(baseWeight * (SALT_PCT / 100));

    recipeCard = (
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-900 animate-in fade-in slide-in-from-top-2">
         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-200/50">
           <ScrollText size={16} />
           <span className="font-bold text-sm">当前配方: {recipe.split(' ')[1]}</span>
         </div>
         <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-yellow-100 shadow-sm">
               <div className="text-xs text-gray-400 mb-1">面粉 (100%)</div>
               <div className="font-bold text-lg text-gray-800">{baseWeight}g</div>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 shadow-sm">
               <div className="text-xs text-blue-400 mb-1">水 ({targetPct}%)</div>
               <div className="font-bold text-lg text-blue-700">{waterW}g</div>
            </div>
             <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 shadow-sm">
               <div className="text-xs text-orange-400 mb-1">酵母 ({YEAST_PCT}%)</div>
               <div className="font-bold text-lg text-orange-700">{yeastW === 0 ? '<1' : yeastW}g</div>
            </div>
             <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm">
               <div className="text-xs text-gray-400 mb-1">盐 ({SALT_PCT}%)</div>
               <div className="font-bold text-lg text-gray-600">{saltW === 0 ? '<1' : saltW}g</div>
            </div>
         </div>
         <div className="text-[10px] text-yellow-700/60 mt-2 text-center">
            * 建议顺序: 面粉 → 归零 → 水 → 归零 → 酵母/盐
         </div>
      </div>
    );
  }

  // 底部功能区渲染逻辑
  let bottomControls = null;
  if (!isPoweredOn) {
    bottomControls = (
      <div className="flex flex-col items-center justify-center py-12 text-gray-300 animate-in fade-in duration-500">
        <Power size={48} className="mb-2 opacity-10" />
        <p className="text-sm opacity-50">系统已关闭</p>
      </div>
    );
  } else if (showTimerMenu) {
    // ... 计时器模块 ...
    bottomControls = (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
            <Timer size={18} /> 计时器设置 (Timer Settings)
          </div>
          <button onClick={() => setShowTimerMenu(false)} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* 正计时控制 */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <label className="text-xs text-gray-400 font-mono mb-3 block uppercase">Count Up (正计时)</label>
          <div className="flex gap-3">
            {timerState === "RUNNING" ? (
              <button onClick={pauseTimer} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Pause size={18} /> 暂停
              </button>
            ) : (
              <button onClick={timerState === "PAUSED" ? resumeTimer : startCountUp} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Play size={18} /> {timerState === "PAUSED" ? "继续" : "开始"}
              </button>
            )}
            <button onClick={resetTimer} className="w-16 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center active:scale-95 transition-all">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* 倒计时预设 */}
        <div>
          <label className="text-xs text-gray-400 font-mono mb-3 block uppercase">Count Down Presets (倒计时)</label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 15, 20, 30, 45, 60].map(m => (
              <button 
                key={m}
                onClick={() => startCountdown(m)}
                className="py-2 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors shadow-sm active:scale-95"
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (modeIndex === MODE_HIDDEN) {
    // --- 隐藏模式 ---
    bottomControls = (
      <div className="flex flex-col items-center justify-center py-12 text-gray-300 animate-in fade-in duration-500">
        <Power size={48} className="mb-2 opacity-20" />
        <p className="text-sm">功能区隐藏 (Hidden)</p>
        <p className="text-xs opacity-50">点击“切换模式”或“计时器”开启功能</p>
      </div>
    );
  } else if (modeIndex === MODE_BREAD) {
    // --- 面包模式 ---
    bottomControls = (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-4 text-blue-600 font-medium bg-blue-50 w-fit px-3 py-1 rounded-full text-sm">
          <Wheat size={16} /> 面包操作区
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block font-mono">RECIPE SELECT</label>
            <select 
              value={recipe} 
              onChange={(e) => {
                setRecipe(e.target.value);
                setBaseWeight(null);
              }}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(RECIPES).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
              <label className="text-xs text-transparent mb-1 block select-none">ACT</label>
              <button 
              onClick={setBase}
              className="w-full h-[46px] bg-gray-900 text-white rounded-xl font-medium hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                设为基准
              </button>
          </div>
        </div>
        {recipeCard}
      </div>
    );
  } else if (modeIndex === MODE_DIET) {
    // --- 饮食模式 ---
    bottomControls = (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 w-fit px-3 py-1 rounded-full text-sm">
            <Utensils size={16} /> 饮食计算 (点击添加)
          </div>
          <button 
            onClick={() => {
              setMacros({ cal: 0, p: 0, c: 0, f: 0 });
              setLastAdded(null);
              showToast("今日记录已清空");
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="清空记录"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {Object.entries(FOODS).map(([name, val]) => (
            <button
              key={name}
              onClick={() => addFood(name, val)}
              className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-200 active:scale-95 transition-all h-24"
            >
              <span className="text-2xl mb-1">{name.split(' ')[0]}</span>
              <span className="text-xs text-gray-600 font-medium">{name.split(' ')[1]}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          * 点击上方食物将当前重量 ({rawInput - tareOffset}g) 计入总摄入，并自动归零。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-4 md:p-6 font-sans text-gray-900 flex flex-col">
      
      {/* 头部标题区 */}
      <div className="flex items-center justify-between mb-4 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Kitchen Lab Master <span className="bg-gray-200 text-xs px-2 py-1 rounded-full text-gray-600">V7</span>
        </h1>
      </div>

      {/* 顶部模拟器条 (Compact Top Bar) */}
      <div className="w-full bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-6 max-w-5xl mx-auto border border-gray-100">
        <div className="flex items-center gap-2 text-gray-600 font-bold whitespace-nowrap">
          <Scale size={20} className="text-blue-500" />
          <span className="hidden sm:inline">模拟压力传感器</span>
          <span className="sm:hidden">Sensor</span>
        </div>
        
        <div className="flex-1 flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="2000"
            value={rawInput}
            onChange={(e) => setRawInput(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
        
        <div className="flex flex-col items-end min-w-[80px]">
           <div className="font-mono font-bold text-2xl text-blue-600 leading-none">{rawInput}<span className="text-sm text-gray-400 ml-1">g</span></div>
           <div className="text-[10px] text-gray-400 font-mono">RAW INPUT</div>
        </div>
      </div>

      {/* 主界面 (左右分屏) */}
      <div className="max-w-5xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-start">
          
          {/* 左侧：OLED 显示屏 */}
          <div className="bg-black border-4 border-gray-800 rounded-2xl p-6 shadow-2xl relative min-h-[420px] flex flex-col justify-between font-mono text-white transition-all duration-500 h-full">
            {renderOledContent()}
          </div>

          {/* 右侧：物理控制台 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPoweredOn ? 'bg-green-500' : 'bg-red-500'} transition-colors`}></div> Control Console
            </h3>

            {/* 第一排主控键 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button 
                onClick={handleTare}
                className={`flex flex-col items-center justify-center p-3 py-4 rounded-xl active:scale-95 transition-all font-medium ${isPoweredOn ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
              >
                <RotateCcw size={22} className={`mb-2 ${isPoweredOn ? 'text-red-500' : 'text-gray-300'}`} />
                <span className="text-sm">归零</span>
              </button>

              <button 
                onClick={toggleMode}
                className={`flex flex-col items-center justify-center p-3 py-4 rounded-xl active:scale-95 transition-all font-medium group ${isPoweredOn ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
              >
                <ChefHat size={22} className={`mb-2 transition-colors ${!isPoweredOn ? 'text-gray-300' : modeIndex !== MODE_HIDDEN ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="flex flex-col items-center">
                   <span className="text-sm">模式</span>
                   <span className="text-[10px] font-normal opacity-60 mt-0.5">
                     {isPoweredOn ? (modeIndex === 0 ? "隐藏" : modeIndex === 1 ? "饮食" : "面包") : "-"}
                   </span>
                </div>
              </button>

              <button 
                onClick={toggleTimerMenu}
                className={`flex flex-col items-center justify-center p-3 py-4 rounded-xl active:scale-95 transition-all font-medium border-2 ${!isPoweredOn ? "bg-gray-50 text-gray-300 border-transparent cursor-not-allowed" : showTimerMenu ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-100 border-transparent text-gray-700 hover:bg-gray-200"}`}
              >
                <Timer size={22} className="mb-2" />
                <div className="flex flex-col items-center">
                   <span className="text-sm">计时</span>
                   <span className="text-[10px] opacity-60 font-normal mt-0.5">{timerState === "RUNNING" ? "运行" : "设置"}</span>
                </div>
              </button>
            </div>

            {/* 第二排系统键 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button 
                onClick={setStandby}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium active:scale-95 transition-all gap-1 ${isPoweredOn ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
              >
                <Moon size={14} /> 待机
              </button>

              <button 
                onClick={togglePower}
                className="flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium bg-gray-800 text-white hover:bg-gray-900 active:scale-95 transition-all gap-1 shadow-md"
              >
                <Power size={14} className={!isPoweredOn ? "text-red-500" : "text-green-400"} /> 
                {isPoweredOn ? "重启" : "开机"}
              </button>

              <button 
                onClick={toggleMute}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium active:scale-95 transition-all gap-1 ${isPoweredOn ? (isMuted ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200') : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />} 
                {isMuted ? "已静音" : "静音"}
              </button>
            </div>

            <div className="h-px bg-gray-100 mb-6 w-full"></div>

            {/* 动态区域 (Flex Grow ensure it pushes down) */}
            <div className="flex-1">
               {bottomControls}
            </div>

          </div>
        </div>
      </div>

      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-medium animate-in fade-in slide-in-from-bottom-4 z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-gray-800'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}