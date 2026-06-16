'use client';

import { TrendingUp, Minus, TrendingDown, Gauge, AlertCircle } from 'lucide-react';
import type { BullBaseBearScenarioSummary, BullBaseBearScenario } from '@/types/scenario';

interface EnhancedBullBaseBearScenariosPanelProps {
  scenarios: BullBaseBearScenarioSummary | null;
}

/**
 * 情景数据头部组件
 */
function ScenarioDataHeader({ scenarios }: { scenarios: BullBaseBearScenarioSummary }) {
  const isComplete = scenarios.dataStatus === 'complete';
  const isPartial = scenarios.dataStatus === 'partial';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-3">
        <Gauge className="h-5 w-5 text-[var(--brand-ink)]" />
        <div>
          <h3 className="text-sm font-semibold text-gray-800">买方情景推演</h3>
          <p className="text-xs text-gray-500">
            {isComplete ? '基于真实财报和估值数据生成' :
             isPartial ? '基于部分真实数据生成' : '基于模拟数据生成'}
          </p>
        </div>
      </div>
      {scenarios.currentPrice && (
        <div className="text-right">
          <p className="text-xs text-gray-500">当前价格</p>
          <p className="text-lg font-bold text-gray-900">${scenarios.currentPrice.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

/**
 * 情景变化颜色类
 */
function getReturnColor(returnPct?: number | null) {
  if (returnPct === undefined || returnPct === null) return 'text-gray-600';
  if (returnPct > 0) return 'text-green-600';
  if (returnPct < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * 单个情景卡片
 */
function ScenarioCard({
  scenario,
  type
}: {
  scenario: BullBaseBearScenario;
  type: 'bull' | 'base' | 'bear';
}) {
  const Icon = type === 'bull' ? TrendingUp : type === 'base' ? Minus : TrendingDown;
  const borderColor = type === 'bull' ? 'border-green-200 bg-green-50' :
                     type === 'base' ? 'border-gray-200 bg-gray-50' :
                     'border-red-200 bg-red-50';
  const iconColor = type === 'bull' ? 'text-green-500' :
                   type === 'base' ? 'text-gray-500' :
                   'text-red-500';

  const impliedReturn = scenario.impliedReturnPct;

  return (
    <div className={`rounded-lg border ${borderColor} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <span className="font-semibold text-gray-800">{scenario.label}</span>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-700">
          {(scenario.probability * 100).toFixed(0)}% 概率
        </span>
      </div>

      {/* 估值演算和情景变化 */}
      {scenario.targetPrice !== undefined && scenario.targetPrice !== null && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">估值演算</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">
              ${scenario.targetPrice.toFixed(2)}
            </span>
            {impliedReturn !== undefined && impliedReturn !== null && (
              <span className={`text-sm font-semibold ${getReturnColor(impliedReturn)}`}>
                {impliedReturn > 0 ? '+' : ''}{impliedReturn.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* 核心假设 */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-semibold text-gray-600">核心假设</p>
        <ul className="space-y-1">
          {scenario.coreAssumptions.slice(0, 3).map((assumption: string, index: number) => (
            <li key={index} className="text-xs text-gray-700">• {assumption}</li>
          ))}
        </ul>
      </div>

      {/* 触发条件 */}
      {scenario.triggerConditions && scenario.triggerConditions.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold text-gray-600">触发条件</p>
          <ul className="space-y-1">
            {scenario.triggerConditions.slice(0, 2).map((condition: string, index: number) => (
              <li key={index} className="text-xs text-gray-600">• {condition}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 估值计算推导 */}
      {scenario.derivationNote && (
        <div className="mt-3 rounded-md bg-white/60 p-2 text-xs font-mono text-gray-600">
          {scenario.derivationNote}
        </div>
      )}
    </div>
  );
}

/**
 * 概率加权汇总卡片
 */
function RiskRewardSummary({ summary, currentPrice }: { summary?: BullBaseBearScenarioSummary; currentPrice?: number }) {
  if (!summary) {
    return null;
  }

  const bullScenario = summary.scenarios?.find((s: BullBaseBearScenario) => s.case === 'bull');
  const bearScenario = summary.scenarios?.find((s: BullBaseBearScenario) => s.case === 'bear');
  const bullUpside = bullScenario?.impliedReturnPct;
  const bearDownside = bearScenario?.impliedReturnPct;

  const expectedReturn = summary.riskRewardSummary?.expectedReturnPct;
  const weightedTarget = summary.probabilityWeightedTargetPrice;

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">概率加权汇总</h4>
      <div className="grid gap-4 md:grid-cols-3">
        {/* 概率加权变化 */}
        {expectedReturn !== undefined && (
          <div>
            <p className="text-xs text-gray-500">概率加权变化</p>
            <p className={`text-lg font-bold ${getReturnColor(expectedReturn)}`}>
              {expectedReturn > 0 ? '+' : ''}{expectedReturn.toFixed(1)}%
            </p>
          </div>
        )}

        {/* 加权估值演算 */}
        {weightedTarget !== undefined && weightedTarget !== null && (
          <div>
            <p className="text-xs text-gray-500">概率加权估值演算</p>
            <p className="text-lg font-bold text-gray-900">${weightedTarget.toFixed(2)}</p>
            {currentPrice && (
              <p className={`text-xs ${getReturnColor(calculateImpliedReturnSimple(weightedTarget, currentPrice))}`}>
                vs 当前价格: {calculateImpliedReturnSimple(weightedTarget, currentPrice) > 0 ? '+' : ''}
                {calculateImpliedReturnSimple(weightedTarget, currentPrice).toFixed(1)}%
              </p>
            )}
          </div>
        )}

        {/* 上下行幅度比 */}
        {bullUpside !== undefined && bullUpside !== null && bearDownside !== undefined && bearDownside !== null && bearDownside < 0 && (
          <div>
            <p className="text-xs text-gray-500">上下行幅度比</p>
            <p className="text-lg font-bold text-gray-900">
              {Math.abs(bullUpside / bearDownside).toFixed(2)}x
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-green-600">+{bullUpside.toFixed(1)}%</span>
              <span className="text-gray-400">:</span>
              <span className="text-red-600">{bearDownside.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 简单计算相对当前价格的情景变化幅度
 */
function calculateImpliedReturnSimple(targetPrice: number, currentPrice: number): number {
  if (!currentPrice || !targetPrice || currentPrice === 0) return 0;
  return ((targetPrice / currentPrice) - 1) * 100;
}

/**
 * 情景来源页脚
 */
function ScenarioSourceFooter({ scenarios }: { scenarios: BullBaseBearScenarioSummary }) {
  return (
    <div className="rounded-lg border border-border bg-gray-50 p-4">
      <p className="text-xs text-gray-600">{scenarios.sourceNote}</p>
      {scenarios.warnings && scenarios.warnings.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-1 text-xs text-yellow-700">
            <AlertCircle className="h-3 w-3" />
            <span>提醒</span>
          </div>
          <ul className="mt-1 space-y-1">
            {scenarios.warnings.slice(0, 2).map((warning, index) => (
              <li key={index} className="text-xs text-yellow-700">• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * 无情景数据提示组件
 */
function NoScenarioNotice() {
  return (
    <div className="rounded-lg border border-border bg-white p-6 text-center">
      <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-400" />
      <h3 className="mb-2 text-sm font-semibold text-gray-700">情景数据不可用</h3>
      <p className="text-sm text-gray-500">暂无足够数据生成买方情景推演</p>
    </div>
  );
}

/**
 * 增强版买方情景推演面板
 */
export function EnhancedBullBaseBearScenariosPanel({ scenarios }: EnhancedBullBaseBearScenariosPanelProps) {
  if (!scenarios || !scenarios.scenarios || scenarios.scenarios.length === 0) {
    return <NoScenarioNotice />;
  }

  const bullScenario = scenarios.scenarios.find(s => s.case === 'bull');
  const baseScenario = scenarios.scenarios.find(s => s.case === 'base');
  const bearScenario = scenarios.scenarios.find(s => s.case === 'bear');

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <ScenarioDataHeader scenarios={scenarios} />

      {/* 三个情景卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        {bearScenario && (
          <ScenarioCard
            scenario={bearScenario}
            type="bear"
          />
        )}
        {baseScenario && (
          <ScenarioCard
            scenario={baseScenario}
            type="base"
          />
        )}
        {bullScenario && (
          <ScenarioCard
            scenario={bullScenario}
            type="bull"
          />
        )}
      </div>

      {/* 概率加权汇总 */}
      <RiskRewardSummary summary={scenarios} currentPrice={scenarios.currentPrice} />

      {/* 来源和免责 */}
      <ScenarioSourceFooter scenarios={scenarios} />
    </div>
  );
}
