import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Svg, { Path, Polyline, Circle } from 'react-native-svg';
import { colors } from '../styles/theme';
import { vw, vh } from '../utils/responsive';
import Logo from '../assets/svg/Code/Logo';

const { width: SCREEN_W } = Dimensions.get('window');

/* ─── Mock Data ─────────────────────────────────────────────────── */
const STATS = [
  { label: 'Total Orders', value: '124', icon: '🛒', color: colors.primary, bg: colors.secondaryLight },
  { label: 'Pending', value: '6', icon: '⏳', color: colors.warning, bg: colors.warningSoft },
  { label: 'Revenue', value: '₹8,365', icon: '💰', color: colors.success, bg: colors.successSoft },
];

const RECENT_ORDERS = [
  { id: '#1042', item: 'Butter Chicken', price: '₹340', status: 'Delivered', time: '2 min ago', thumb: null },
  { id: '#1041', item: 'Paneer Tikka', price: '₹280', status: 'Preparing', time: '10 min ago', thumb: null },
  { id: '#1040', item: 'Veg Biryani', price: '₹220', status: 'Delivered', time: '35 min ago', thumb: null },
  { id: '#1039', item: 'Masala Dosa', price: '₹180', status: 'Cancelled', time: '1 hr ago', thumb: null },
];

const MENU_ITEMS = [
  { name: 'Butter Chicken', price: '₹340', category: 'Main Course', active: true },
  { name: 'Paneer Tikka', price: '₹280', category: 'Starters', active: true },
  { name: 'Veg Biryani', price: '₹220', category: 'Rice', active: false },
  { name: 'Masala Dosa', price: '₹180', category: 'Breakfast', active: true },
];

/* Fake sparkline data */
const CHART_POINTS = [40, 65, 45, 80, 60, 90, 75, 95, 70, 110, 88, 120];

type Tab = 'Overview' | 'Orders' | 'Menu';

/* ─── Main Component ─────────────────────────────────────────────── */
export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo height={28} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetRow}>
        <Text style={styles.greetText}>Hello, Ahmed 👋</Text>
        <Text style={styles.greetSub}>Here's your business summary today</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['Overview', 'Orders', 'Menu'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Orders' && <OrdersTab />}
        {activeTab === 'Menu' && <MenuTab />}
      </ScrollView>
    </View>
  );
}

/* ─── Overview Tab ───────────────────────────────────────────────── */
function OverviewTab() {
  return (
    <>
      {/* Stat Cards */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Revenue Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Revenue This Month</Text>
        <MiniLineChart data={CHART_POINTS} />
        <View style={styles.chartLegend}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <Text key={d} style={styles.chartLegendText}>{d}</Text>
          ))}
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Recent Orders</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {RECENT_ORDERS.slice(0, 3).map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </View>

      {/* Top Menu Items */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Top Selling Items</Text>
        {MENU_ITEMS.slice(0, 3).map((item) => (
          <MenuRow key={item.name} item={item} showToggle={false} />
        ))}
      </View>
    </>
  );
}

/* ─── Orders Tab ─────────────────────────────────────────────────── */
function OrdersTab() {
  const [filter, setFilter] = useState<string>('All');
  const statuses = ['All', 'Delivered', 'Preparing', 'Cancelled'];
  const filtered =
    filter === 'All' ? RECENT_ORDERS : RECENT_ORDERS.filter((o) => o.status === filter);

  return (
    <View style={styles.sectionCard}>
      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {statuses.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filter === s && styles.filterChipActive]}
            onPress={() => setFilter(s)}
          >
            <Text style={[styles.filterChipText, filter === s && styles.filterChipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map((order) => (
        <OrderRow key={order.id} order={order} expanded />
      ))}
    </View>
  );
}

/* ─── Menu Tab ───────────────────────────────────────────────────── */
function MenuTab() {
  const [items, setItems] = useState(MENU_ITEMS);

  const toggle = (name: string) => {
    setItems((prev) =>
      prev.map((i) => (i.name === name ? { ...i, active: !i.active } : i))
    );
  };

  return (
    <>
      <TouchableOpacity style={styles.addMenuBtn}>
        <Text style={styles.addMenuBtnText}>+ Add New Item</Text>
      </TouchableOpacity>
      <View style={styles.sectionCard}>
        {items.map((item) => (
          <MenuRow key={item.name} item={item} showToggle onToggle={() => toggle(item.name)} />
        ))}
      </View>
    </>
  );
}

/* ─── Shared Sub-Components ──────────────────────────────────────── */
function OrderRow({ order, expanded }: { order: typeof RECENT_ORDERS[0]; expanded?: boolean }) {
  const statusColor: Record<string, string> = {
    Delivered: colors.success,
    Preparing: colors.warning,
    Cancelled: colors.error,
  };

  return (
    <View style={styles.orderRow}>
      <View style={styles.orderLeft}>
        <View style={styles.orderThumb}>
          <Text style={{ fontSize: 18 }}>🍽️</Text>
        </View>
        <View>
          <Text style={styles.orderItem}>{order.item}</Text>
          <Text style={styles.orderId}>{order.id} · {order.time}</Text>
          {expanded && (
            <Text style={styles.orderPrice}>{order.price}</Text>
          )}
        </View>
      </View>
      <View style={styles.orderRight}>
        {!expanded && <Text style={styles.orderPrice}>{order.price}</Text>}
        <View style={[styles.statusBadge, { backgroundColor: statusColor[order.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor[order.status] }]}>
            {order.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MenuRow({ item, showToggle, onToggle }: { item: typeof MENU_ITEMS[0]; showToggle: boolean; onToggle?: () => void }) {
  return (
    <View style={styles.menuRow}>
      <View style={styles.menuThumb}>
        <Text style={{ fontSize: 20 }}>🍛</Text>
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuCategory}>{item.category}</Text>
      </View>
      <View style={styles.menuRight}>
        <Text style={styles.menuPrice}>{item.price}</Text>
        {showToggle && (
          <TouchableOpacity
            style={[styles.toggleBtn, item.active ? styles.toggleOn : styles.toggleOff]}
            onPress={onToggle}
          >
            <Text style={styles.toggleText}>{item.active ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ─── Mini Line Chart ────────────────────────────────────────────── */
function MiniLineChart({ data }: { data: number[] }) {
  const chartW = SCREEN_W - vw(10) - 40;
  const chartH = 80;
  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * chartW;
      const y = chartH - ((v - min) / (max - min || 1)) * (chartH - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  const lastIdx = data.length - 1;
  const lastX = chartW;
  const lastY = chartH - ((data[lastIdx] - min) / (max - min || 1)) * (chartH - 10) - 5;

  return (
    <View style={{ height: chartH + 10, marginTop: 12 }}>
      <Svg width={chartW} height={chartH + 10}>
        <Polyline
          points={points}
          fill="none"
          stroke={colors.primary}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={lastX} cy={lastY} r={5} fill={colors.primary} />
      </Svg>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMuted },

  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: vw(5),
  },
  headerLeft: {},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifBtn: { position: 'relative' },
  notifIcon: { fontSize: 20 },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  greetRow: {
    backgroundColor: colors.primary,
    paddingHorizontal: vw(5),
    paddingBottom: 20,
  },
  greetText: { color: colors.textLight, fontSize: 22, fontWeight: '800' },
  greetSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 3 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.screen,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },

  scroll: { padding: vw(4), paddingBottom: 40, gap: 14 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 3, textAlign: 'center' },

  chartCard: {
    backgroundColor: colors.screen,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chartLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chartLegendText: { fontSize: 10, color: colors.textMuted },

  sectionCard: {
    backgroundColor: colors.screen,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  viewAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  orderThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItem: { fontSize: 14, fontWeight: '600', color: colors.text },
  orderId: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  orderPrice: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 12,
  },
  menuThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 14, fontWeight: '600', color: colors.text },
  menuCategory: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  menuRight: { alignItems: 'flex-end', gap: 6 },
  menuPrice: { fontSize: 14, fontWeight: '700', color: colors.primary },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  toggleOn: { backgroundColor: colors.successSoft },
  toggleOff: { backgroundColor: colors.errorSoft },
  toggleText: { fontSize: 10, fontWeight: '700', color: colors.text },

  filterRow: { marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  filterChipTextSelected: { color: colors.textLight },
  filterChipTextActive: { color: colors.textLight },

  addMenuBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 2,
  },
  addMenuBtnText: { color: colors.textLight, fontSize: 15, fontWeight: '700' },
});
