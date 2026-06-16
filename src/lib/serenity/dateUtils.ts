/**
 * Serenity Skills - 日期工具函数
 *
 * 用于生成合理的、基于当前时间的日期。
 */

/**
 * 获取当前日期
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * 生成最近的日期（往前推 N 天）
 */
export function getRecentDate(daysAgo: number): string {
  const date = getCurrentDate();
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
}

/**
 * 生成最近的季度末日期
 */
export function getRecentQuarterEnd(): string {
  const date = getCurrentDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  let quarterEndMonth: number;
  let quarterEndYear: number;

  if (month < 3) {
    // Q1 (Jan-Mar) - use Q4 of last year
    quarterEndMonth = 11; // Dec
    quarterEndYear = year - 1;
  } else if (month < 6) {
    // Q2 (Apr-Jun) - use Q1 of current year
    quarterEndMonth = 2; // Mar
    quarterEndYear = year;
  } else if (month < 9) {
    // Q3 (Jul-Sep) - use Q2 of current year
    quarterEndMonth = 5; // Jun
    quarterEndYear = year;
  } else {
    // Q4 (Oct-Dec) - use Q3 of current year
    quarterEndMonth = 8; // Sep
    quarterEndYear = year;
  }

  const quarterEndDate = new Date(quarterEndYear, quarterEndMonth, getLastDayOfMonth(quarterEndYear, quarterEndMonth));
  return formatDate(quarterEndDate);
}

/**
 * 获取最近的年报日期（通常是上一年的 12 月 31 日）
 */
export function getRecentAnnualReport(): string {
  const date = getCurrentDate();
  return formatDate(new Date(date.getFullYear() - 1, 11, 31));
}

/**
 * 获取最近的季度报日期
 */
export function getRecentQuarterlyReport(): string {
  return getRecentQuarterEnd();
}

/**
 * 获取最近的财报电话会日期（通常是季度末后 2-4 周）
 */
export function getRecentEarningsCall(): string {
  const quarterEnd = new Date(getRecentQuarterEnd());
  quarterEnd.setDate(quarterEnd.getDate() + 21); // +3 周
  return formatDate(quarterEnd);
}

/**
 * 获取某个月份的最后一天
 */
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取当前年份
 */
export function getCurrentYear(): number {
  return getCurrentDate().getFullYear();
}

/**
 * 获取前一年年份
 */
export function getPreviousYear(): number {
  return getCurrentYear() - 1;
}
