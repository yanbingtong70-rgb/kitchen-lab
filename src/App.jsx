import React, { useState, useEffect } from 'react';
import { Scale, Timer, RotateCcw, Utensils, ChefHat, Trash2, Wheat, ScrollText, Power, Play, Pause, RefreshCw, X, Moon, Volume2, VolumeX, Coffee } from 'lucide-react';

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
  "🥑 牛油果": { cal: 160, p: 2, c: 9, f: 15 },
  "☕ 咖啡豆": { cal: 0, p: 0, c: 0, f: 0 }, // 新增咖啡
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
  // 主秤 (Main Scale) - 5kg max, 1g precision
  const [rawMain, setRawMain] = useState(0); 
  const [tareMain, setTareMain] = useState(0);

  // 副秤 (Sub Scale) - 500g max, 0.1g precision
  const [rawSub, setRawSub] = useState(0); 
  const [tareSub, setTareSub] = useState(0);
  
  // 核心模式状态
  const [modeIndex, setModeIndex] = useState(MODE_HIDDEN); 
  const [baseWeight, setBaseWeight] = useState(null);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  
  // 系统设置状态
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // 计时器状态
  const [timerState, setTimerState] = useState("IDLE");
  const [timerMode, setTimerMode] = useState("UP");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInitial, setTimerInitial] = useState(0);

  // 业务数据状态
  const [recipe, setRecipe] = useState("🍞 乡村面包 (75%)");
  const [macros, setMacros] = useState({ cal: 0, p: 0, c: 0, f: 0 });
  const [lastAdded, setLastAdded] = useState(null);

  // 提示信息
  const [toast, setToast] = useState(null);

  // 计算净重
  const netMain = rawMain - tareMain;
  const netSub = (rawSub - tareSub).toFixed(1); // 副秤保留一位小数

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

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- 操作处理函数 ---
  const handleTareMain = () => {
    if (!isPoweredOn) return;
    setTareMain(rawMain);
  };

  const handleTareSub = () => {
    if (!isPoweredOn) return;
    setTareSub(rawSub);
  };

  const handleTareBoth = () => {
    if (!isPoweredOn) return;
    setTareMain(rawMain);
    setTareSub(rawSub);
    showToast("双秤已归零");
  }

  const toggleMode = () => {
    if (!isPoweredOn) return;
    setModeIndex(prev => (prev + 1) % 3);
    setBaseWeight(null);
    setShowTimerMenu(false);
  };

  const toggleTimerMenu = () => {
    if (!isPoweredOn) return;
    setShowTimerMenu(prev => !prev);
  };

  const togglePower = () => {
    if (isPoweredOn) {
      setIsPoweredOn(false);
      showToast("正在关机...", "default");
    } else {
      setIsPoweredOn(true);
      setTareMain(rawMain);
      setTareSub(rawSub);
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
    // 烘焙模式通常使用主秤称面粉
    if (netMain > 0) {
      setBaseWeight(netMain);
      showToast(`面粉基准已锁定: ${netMain}g (主秤)`);
    } else {
      showToast("请在主秤上放面粉", "error");
    }
  };

  const addFood = (name, val) => {
    // 智能判断：如果副秤有读数，优先使用副秤（精度高），否则使用主秤
    let usedWeight = 0;
    let scaleSource = "";

    if (parseFloat(netSub) > 0.1) {
      usedWeight = parseFloat(netSub);
      scaleSource = "副秤";
    } else if (netMain > 0) {
      usedWeight = netMain;
      scaleSource = "主秤";
    }

    if (usedWeight > 0) {
      const factor = usedWeight / 100;
      
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
        weight: usedWeight,
        cal: addedCal,
        p: addedP,
        c: addedC,
        f: addedF
      });

      showToast(`已记录 ${name} ${usedWeight}g (${scaleSource})`);
      
      // 自动归零逻辑：用了哪个秤归零哪个
      if (scaleSource === "副秤") setTareSub(rawSub);
      else setTareMain(rawMain);

    } else {
      showToast("请先放食物 (任意秤)", "error");
    }
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
  };

  // --- 渲染逻辑 ---

  const renderOledContent = () => {
    if (!isPoweredOn) {
      return (
        <div className="flex items-center justify-center h-full w-full animate-out fade-out duration-1000">
           {/* 黑屏 */}
        </div>
      );
    }

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

    let modeLabel = "STANDBY";
    if (modeIndex === MODE_DIET) modeLabel = "🥗 DIET CALC";
    if (modeIndex === MODE_BREAD) modeLabel = "🥖 BREAD MAKER";

    // 副屏区域逻辑
    let subScreen;
    if (modeIndex === MODE_HIDDEN) {
      subScreen = (
        <div className="flex justify-center items-end w-full mt-4 pt-3 border-t border-gray-800">
           <div className="text-gray-600 font-mono text-sm">READY</div>
        </div>
      );
    } else if (modeIndex === MODE_BREAD) {
      // 烘焙模式
      const targetPct = RECIPES[recipe];
      let guideText = "等待设定基准 (主秤放面粉)";
      let pctText = "--.-%";
      let guideColor = "#666";
      let valColor = "#444";

      if (baseWeight) {
        const currPct = (netMain / baseWeight) * 100;
        const targetWater = Math.round(baseWeight * (targetPct / 100));
        
        guideColor = "#00ff00"; 
        valColor = "#00e5ff"; 
        pctText = `${currPct.toFixed(1)}%`;

        if (netMain < targetWater * 0.1) {
          guideText = `🎯 目标水量: ${targetWater}g`;
        } else if (Math.abs(netMain - targetWater) < 5) {
          guideText = "✅ 水量完美";
          valColor = "#00ff00";
        } else if (netMain > targetWater) {
           guideText = `⚠️ 水量过多: +${netMain - targetWater}g`;
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
            <div className="flex flex-col items-start">
               <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Total Daily</div>
               <div className="text-2xl font-bold font-sans text-orange-500">
                  {Math.round(macros.cal)} <span className="text-sm text-gray-500">kcal</span>
               </div>
               <div className="text-[10px] text-gray-400 font-mono mt-1">
                  P:{Math.round(macros.p)} C:{Math.round(macros.c)} F:{Math.round(macros.f)}
               </div>
            </div>
            <div className="flex flex-col items-end border-l border-gray-800 pl-4">
               <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Last Added</div>
               {lastAdded ? (
                 <>
                  <div className="text-xl font-bold font-sans text-green-400">
                      +{Math.round(lastAdded.cal)} <span className="text-xs text-gray-500">kcal</span>
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

        {/* 双秤重量显示区 */}
        <div className="flex items-end justify-between py-6">
          {/* 左：主秤读数 (大) */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold mb-1 tracking-wider">MAIN PLATFORM</span>
            <div className="text-[4rem] font-bold leading-none tracking-tighter text-white">
              {netMain} <span className="text-xl text-gray-600 font-normal">g</span>
            </div>
          </div>

          {/* 右：副秤读数 (小，高亮) */}
          <div className="flex flex-col items-end pb-2">
            <span className="text-[10px] text-yellow-600 font-bold mb-1 tracking-wider">SMALL SCALE</span>
            <div className="text-[2.5rem] font-bold leading-none tracking-tighter text-yellow-400 font-mono">
              {netSub} <span className="text-sm text-yellow-700 font-normal">g</span>
            </div>
          </div>
        </div>

        {/* 副屏区域 */}
        {subScreen}
      </>
    );
  };

  let bottomControls = null;
  // 底部功能区渲染逻辑
  
  // 计算配比卡片 (面包模式)
  let recipeCard = null;
  if (isPoweredOn && modeIndex === MODE_BREAD && baseWeight) {
    const targetPct = RECIPES[recipe];
    const waterW = Math.round(baseWeight * (targetPct / 100));
    const yeastW = (baseWeight * (YEAST_PCT / 100)).toFixed(1); // 酵母保留小数
    const saltW = (baseWeight * (SALT_PCT / 100)).toFixed(1);   // 盐保留小数

    recipeCard = (
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-900 animate-in fade-in slide-in-from-top-2">
         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-200/50">
           <ScrollText size={16} />
           <span className="font-bold text-sm">当前配方: {recipe.split(' ')[1]}</span>
         </div>
         <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-yellow-100 shadow-sm">
               <div className="text-xs text-gray-400 mb-1">主秤:面粉 (100%)</div>
               <div className="font-bold text-lg text-gray-800">{baseWeight}g</div>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 shadow-sm">
               <div className="text-xs text-blue-400 mb-1">主秤:水 ({targetPct}%)</div>
               <div className="font-bold text-lg text-blue-700">{waterW}g</div>
            </div>
             <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 shadow-sm ring-2 ring-orange-200">
               <div className="text-[10px] text-orange-500 mb-1 font-bold">小秤:酵母 ({YEAST_PCT}%)</div>
               <div className="font-bold text-lg text-orange-700">{yeastW}g</div>
            </div>
             <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm ring-2 ring-gray-200">
               <div className="text-[10px] text-gray-500 mb-1 font-bold">小秤:盐 ({SALT_PCT}%)</div>
               <div className="font-bold text-lg text-gray-600">{saltW}g</div>
            </div>
         </div>
         <div className="text-[10px] text-yellow-700/60 mt-2 text-center">
            * 提示：大重量请用左侧主秤，微量(酵母/盐)请用右侧小秤
         </div>
      </div>
    );
  }

  // 渲染 Bottom Controls
  if (!isPoweredOn) {
    bottomControls = (
      <div className="flex flex-col items-center justify-center py-12 text-gray-300 animate-in fade-in duration-500">
        <Power size={48} className="mb-2 opacity-10" />
        <p className="text-sm opacity-50">系统已关闭</p>
      </div>
    );
  } else if (showTimerMenu) {
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
        <div>
          <label className="text-xs text-gray-400 font-mono mb-3 block uppercase">Count Down Presets (倒计时)</label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 15, 20, 30, 45, 60].map(m => (
              <button key={m} onClick={() => startCountdown(m)} className="py-2 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors shadow-sm active:scale-95">{m}m</button>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (modeIndex === MODE_HIDDEN) {
    bottomControls = (
      <div className="flex flex-col items-center justify-center py-12 text-gray-300 animate-in fade-in duration-500">
        <Power size={48} className="mb-2 opacity-20" />
        <p className="text-sm">功能区隐藏 (Hidden)</p>
        <p className="text-xs opacity-50">点击“切换模式”或“计时器”开启功能</p>
      </div>
    );
  } else if (modeIndex === MODE_BREAD) {
    bottomControls = (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-4 text-blue-600 font-medium bg-blue-50 w-fit px-3 py-1 rounded-full text-sm">
          <Wheat size={16} /> 面包操作区
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block font-mono">RECIPE SELECT</label>
            <select value={recipe} onChange={(e) => { setRecipe(e.target.value); setBaseWeight(null); }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
              {Object.keys(RECIPES).map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="col-span-1">
              <label className="text-xs text-transparent mb-1 block select-none">ACT</label>
              <button onClick={setBase} className="w-full h-[46px] bg-gray-900 text-white rounded-xl font-medium hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2">设为基准</button>
          </div>
        </div>
        {recipeCard}
      </div>
    );
  } else if (modeIndex === MODE_DIET) {
    bottomControls = (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 w-fit px-3 py-1 rounded-full text-sm">
            <Utensils size={16} /> 饮食计算 (自动识别主/副秤)
          </div>
          <button onClick={() => { setMacros({ cal: 0, p: 0, c: 0, f: 0 }); setLastAdded(null); showToast("今日记录已清空"); }} className="text-gray-400 hover:text-red-500 transition-colors" title="清空记录">
            <Trash2 size={18} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(FOODS).map(([name, val]) => (
            <button key={name} onClick={() => addFood(name, val)} className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-200 active:scale-95 transition-all h-24">
              <span className="text-2xl mb-1">{name.split(' ')[0]}</span>
              <span className="text-xs text-gray-600 font-medium">{name.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-4 md:p-6 font-sans text-gray-900 flex flex-col">
      <div className="flex items-center justify-between mb-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Kitchen Lab Master <span className="bg-gray-200 text-xs px-2 py-1 rounded-full text-gray-600">Dual V8</span>
        </h1>
      </div>

      {/* --- 顶部模拟器区 (左右双秤布局) --- */}
      <div className="w-full max-w-6xl mx-auto mb-6 flex flex-col md:flex-row gap-6">
        
        {/* 左侧：主秤模拟 (Main) */}
        <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gray-200"></div>
          <div className="flex justify-between items-center mb-4 pl-4">
            <div className="flex items-center gap-2 text-gray-700 font-bold">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">L</div>
              <div>
                <div className="text-sm">Main Platform</div>
                <div className="text-[10px] text-gray-400 font-normal">Max 5000g / d=1g</div>
              </div>
            </div>
            <div className="font-mono font-bold text-3xl text-gray-800">{rawMain}<span className="text-sm text-gray-400 ml-1">g</span></div>
          </div>
          <input type="range" min="0" max="5000" value={rawMain} onChange={(e) => setRawMain(parseInt(e.target.value))} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600 pl-4" />
        </div>

        {/* 右侧：副秤模拟 (Sub) */}
        <div className="flex-[0.6] bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden border-t-4 border-t-yellow-400">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-yellow-700 font-bold">
              <div className="w-8 h-8 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">S</div>
              <div>
                <div className="text-sm">Small Scale</div>
                <div className="text-[10px] text-yellow-500/80 font-normal">Max 500g / d=0.1g</div>
              </div>
            </div>
            <div className="font-mono font-bold text-3xl text-yellow-600">{parseFloat(rawSub).toFixed(1)}<span className="text-sm text-yellow-400 ml-1">g</span></div>
          </div>
          <input type="range" min="0" max="500" step="0.1" value={rawSub} onChange={(e) => setRawSub(e.target.value)} className="w-full h-3 bg-yellow-50 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
        </div>
      </div>

      {/* --- 主界面 (左右分屏) --- */}
      <div className="max-w-6xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-start">
          
          {/* 左侧：OLED 显示屏 */}
          <div className="bg-black border-8 border-gray-800 rounded-3xl p-8 shadow-2xl relative min-h-[420px] flex flex-col justify-between font-mono text-white transition-all duration-500 h-full">
            {renderOledContent()}
          </div>

          {/* 右侧：物理控制台 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPoweredOn ? 'bg-green-500' : 'bg-red-500'} transition-colors`}></div> Control Console
            </h3>

            {/* 第一排主控键 (归零区) */}
            <div className="grid grid-cols-2 gap-3 mb-3">
               <button onClick={handleTareMain} className={`flex items-center justify-center p-3 rounded-xl active:scale-95 transition-all font-bold border-2 ${isPoweredOn ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100' : 'bg-gray-50 border-transparent text-gray-300'}`}>
                  <RotateCcw size={18} className="mr-2" /> 主秤归零 (L)
               </button>
               <button onClick={handleTareSub} className={`flex items-center justify-center p-3 rounded-xl active:scale-95 transition-all font-bold border-2 ${isPoweredOn ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' : 'bg-gray-50 border-transparent text-gray-300'}`}>
                  <RotateCcw size={18} className="mr-2" /> 小秤归零 (S)
               </button>
            </div>

            {/* 第二排功能键 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button onClick={handleTareBoth} className={`col-span-1 py-3 rounded-lg text-xs font-medium active:scale-95 transition-all bg-gray-800 text-white`}>
                 全归零
              </button>
              <button 
                onClick={toggleMode}
                className={`col-span-2 flex flex-col items-center justify-center p-2 rounded-xl active:scale-95 transition-all font-medium group ${isPoweredOn ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-2">
                   <ChefHat size={18} className={`${!isPoweredOn ? 'text-gray-300' : modeIndex !== MODE_HIDDEN ? 'text-purple-600' : 'text-gray-400'}`} />
                   <span>切换模式</span>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
               {/* 计时器键 */}
               <button 
                onClick={toggleTimerMenu}
                className={`flex flex-col items-center justify-center p-2 rounded-xl active:scale-95 transition-all font-medium border-2 ${!isPoweredOn ? "bg-gray-50 text-gray-300 border-transparent" : showTimerMenu ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-100 border-transparent text-gray-700 hover:bg-gray-200"}`}
              >
                <Timer size={20} className="mb-1" />
                <span className="text-xs">计时器</span>
              </button>

              <button 
                onClick={togglePower}
                className="flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
              >
                <Power size={20} className="mb-1" /> 
                {isPoweredOn ? "重启" : "开机"}
              </button>

              <button 
                onClick={toggleMute}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium active:scale-95 transition-all ${isPoweredOn ? (isMuted ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-200') : 'bg-gray-50 text-gray-300'}`}
              >
                {isMuted ? <VolumeX size={20} className="mb-1"/> : <Volume2 size={20} className="mb-1"/>} 
                {isMuted ? "已静音" : "静音"}
              </button>
            </div>

            <div className="h-px bg-gray-100 mb-6 w-full"></div>

            {/* 动态区域 */}
            <div className="flex-1">
               {bottomControls}
            </div>

          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-medium animate-in fade-in slide-in-from-bottom-4 z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-gray-800'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}