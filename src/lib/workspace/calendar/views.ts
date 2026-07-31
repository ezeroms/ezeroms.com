import {
  createPreactView,
  createViewDay,
  createViewMonthGrid,
  createViewWeek,
  setRangeForWeek,
} from "@schedule-x/calendar";

type CalendarView = ReturnType<typeof createViewWeek>;
type RangeSetter = Parameters<typeof setRangeForWeek>[0];

/** Views that slide by N days from the selected date (not week-aligned). */
export const SLIDING_MULTI_DAY_VIEWS = new Set(["two-days", "four-days"]);

type SlidingMultiDayApp = {
  calendarState: { view: { value: string } };
  config: { timezone: { value: string } };
  timeUnitsImpl: {
    getWeekFor: (
      date: Temporal.PlainDate | Temporal.ZonedDateTime,
    ) => Temporal.ZonedDateTime[];
  };
};

/**
 * Week / multi-day は同じ weekOptions.nDays を共有する。
 * ビューの range 再計算時に正しい日数へ強制し、Day↔2日↔Week 切替で列数がずれないようにする。
 */
function setRangeForWeekWithNDays(nDays: number) {
  return (config: RangeSetter) => {
    const current = config.calendarConfig.weekOptions.value;
    if (current.nDays !== nDays) {
      config.calendarConfig.weekOptions.value = { ...current, nDays };
    }
    return setRangeForWeek(config);
  };
}

/**
 * schedule-x の createWeek / setRangeForWeek は常に
 * `getWeekFor(selected).slice(0, nDays)`（週頭揃え）になる。
 * 2日/4日ビューは選択日から滑る窓にしたいので、該当ビュー中だけ getWeekFor を差し替える。
 */
export function patchSlidingMultiDayWeek(calendarApp: object) {
  const app = (calendarApp as { $app: SlidingMultiDayApp }).$app;
  if (!app?.timeUnitsImpl?.getWeekFor) return;

  const impl = app.timeUnitsImpl as typeof app.timeUnitsImpl & {
    __slidingMultiDayPatched?: boolean;
  };
  if (impl.__slidingMultiDayPatched) return;

  const original = impl.getWeekFor.bind(impl);
  impl.getWeekFor = (date) => {
    if (!SLIDING_MULTI_DAY_VIEWS.has(app.calendarState.view.value)) {
      return original(date);
    }
    const plain =
      date instanceof Temporal.PlainDate ? date : date.toPlainDate();
    const tz = app.config.timezone.value;
    const week: Temporal.ZonedDateTime[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(plain.add({ days: i }).toZonedDateTime(tz));
    }
    return week;
  };
  impl.__slidingMultiDayPatched = true;
}

/**
 * schedule-x は前ビューの DOM を外してから次ビューを同じコンテナに描画する。
 * コンポーネント同一性があると Preact が切り離し DOM を再利用するため、
 * 週系ビューごとに別ラッパーを渡す。
 */
function uniqueComponent(base: CalendarView): CalendarView["Component"] {
  return (props) => base.Component(props);
}

function createMultiDayView(
  nDays: number,
  name: string,
  label: string,
): CalendarView {
  const base = createViewWeek();
  return createPreactView({
    name,
    label,
    Component: uniqueComponent(base),
    setDateRange: setRangeForWeekWithNDays(nDays),
    hasSmallScreenCompat: false,
    hasWideScreenCompat: true,
    // Reuse week view's navigator — avoids importing addDays from a package
    // that Turbopack sometimes fails to resolve as a client export.
    backwardForwardFn: base.backwardForwardFn,
    backwardForwardUnits: nDays,
  });
}

function createLabeledWeekView(): CalendarView {
  const base = createViewWeek();
  return createPreactView({
    name: base.name,
    label: "Week",
    Component: uniqueComponent(base),
    setDateRange: setRangeForWeekWithNDays(7),
    hasSmallScreenCompat: base.hasSmallScreenCompat,
    hasWideScreenCompat: base.hasWideScreenCompat,
    backwardForwardFn: base.backwardForwardFn,
    backwardForwardUnits: 7,
  });
}

/** View dropdown: Day · 2 days · 4 days · Week · Month (English labels). */
export function createWorkspaceCalendarViews(): [
  CalendarView,
  ...CalendarView[],
] {
  return [
    createViewDay(),
    createMultiDayView(2, "two-days", "2 days"),
    createMultiDayView(4, "four-days", "4 days"),
    createLabeledWeekView(),
    createViewMonthGrid(),
  ];
}
