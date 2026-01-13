'use client';

import { useState, useEffect } from 'react';
import { DashboardData, cleanGroupName } from '@/types';
import { fetchCacheStats } from '@/lib/api';

interface StatsViewProps {
  data: DashboardData;
}

export default function BotStats({ data }: StatsViewProps) {
  const topUsers = data.топ_юзеры || [];
  const groups = data.группы || [];
  const ру = data.ру || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  const узб = data.узб || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  const всего = data.всего || { юзеров: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего_слётов: 0, процент: 0 };

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const maxUserSlots = topUsers[0]?.всего || 1;

  // Top groups by total slots
  const sortedGroups = [...groups]
    .sort((a, b) => (b.всего_слётов || 0) - (a.всего_слётов || 0))
    .slice(0, 5);
  const maxGroupSlots = sortedGroups[0]?.всего_слётов || 1;

  // Top groups by percent
  const sortedByPercent = [...groups]
    .filter(x => x.взяли_тг > 0)
    .sort((a, b) => (b.процент || 0) - (a.процент || 0))
    .slice(0, 5);
  const maxPercent = sortedByPercent[0]?.процент || 1;

  return (
    <>
      {/* Summary Table */}
      <div className="summary-table" style={{ marginBottom: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Тип</th>
              <th>👥 Людей</th>
              <th>📱 Взяли ТГ</th>
              <th>👤 Тень</th>
              <th>❄️ Мороз</th>
              <th>✈️ Вылет</th>
              <th>Всего</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            <tr className="ru-row">
              <td>🇷🇺 РУ</td>
              <td>{ру.людей ?? 0}</td>
              <td>{ру.взяли_тг ?? 0}</td>
              <td>{ру.тень ?? 0}</td>
              <td>{ру.мороз ?? 0}</td>
              <td>{ру.вылет ?? 0}</td>
              <td>{ру.всего ?? 0}</td>
              <td><span className="percent-cell">{ру.процент ?? 0}%</span></td>
            </tr>
            <tr className="uzb-row">
              <td>🇺🇿 УЗБ</td>
              <td>{узб.людей ?? 0}</td>
              <td>{узб.взяли_тг ?? 0}</td>
              <td>{узб.тень ?? 0}</td>
              <td>{узб.мороз ?? 0}</td>
              <td>{узб.вылет ?? 0}</td>
              <td>{узб.всего ?? 0}</td>
              <td><span className="percent-cell">{узб.процент ?? 0}%</span></td>
            </tr>
            <tr className="total-row">
              <td>📊 ВСЕГО</td>
              <td>{всего.юзеров ?? 0}</td>
              <td>{всего.взяли_тг ?? 0}</td>
              <td>{всего.тень ?? 0}</td>
              <td>{всего.мороз ?? 0}</td>
              <td>{всего.вылет ?? 0}</td>
              <td>{всего.всего_слётов ?? 0}</td>
              <td><span className="percent-cell">{всего.процент ?? 0}%</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="two-columns">
        {/* Top Slot Users */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">🏆 Топ слётчиков</h2>
          </div>
          <div className="section-content">
            <div className="top-list">
              {topUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Нет данных
                </div>
              ) : (
                topUsers.slice(0, 10).map((user, idx) => (
                  <div key={user.имя + idx} className="top-item">
                    <div className="top-rank">{medals[idx] || idx + 1}</div>
                    <div className="top-info">
                      <div className="top-name">{user.имя}</div>
                      <div className="top-group">{cleanGroupName(user.группа)}</div>
                      <div className="top-bar">
                        <div
                          className="top-bar-fill"
                          style={{ width: `${(user.всего / maxUserSlots) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="top-value">{user.всего}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Groups by Slots */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">📊 Топ групп по слётам</h2>
          </div>
          <div className="section-content">
            <div className="top-list">
              {sortedGroups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Нет данных
                </div>
              ) : (
                sortedGroups.map((group, idx) => (
                  <div key={group.имя} className="top-item">
                    <div className="top-rank">{medals[idx] || idx + 1}</div>
                    <div className="top-info">
                      <div className="top-name">{cleanGroupName(group.имя)}</div>
                      <div className="top-group">{group.взяли_тг} взяли ТГ</div>
                      <div className="top-bar">
                        <div
                          className="top-bar-fill"
                          style={{ width: `${(group.всего_слётов / maxGroupSlots) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="top-value">{group.всего_слётов}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Groups by Percent */}
      <div className="section" style={{ marginTop: '20px' }}>
        <div className="section-header">
          <h2 className="section-title">📈 Топ групп по % слётов</h2>
        </div>
        <div className="section-content">
          <div className="top-list">
            {sortedByPercent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                Нет данных
              </div>
            ) : (
              sortedByPercent.map((group, idx) => (
                <div key={group.имя} className="top-item">
                  <div className="top-rank">{medals[idx] || idx + 1}</div>
                  <div className="top-info">
                    <div className="top-name">{cleanGroupName(group.имя)}</div>
                    <div className="top-group">
                      {group.всего_слётов} из {group.взяли_тг} взявших ТГ
                    </div>
                    <div className="top-bar">
                      <div
                        className="top-bar-fill"
                        style={{
                          width: `${(group.процент / maxPercent) * 100}%`,
                          background: group.процент > 20
                            ? 'linear-gradient(90deg, #ef4444, #f87171)'
                            : group.процент > 12
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : 'linear-gradient(90deg, #10b981, #34d399)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="top-value" style={{
                    color: group.процент > 20
                      ? 'var(--error)'
                      : group.процент > 12
                      ? 'var(--warning)'
                      : 'var(--success)'
                  }}>
                    {group.процент}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface SettingsViewProps {
  data: DashboardData;
  onClearCache: () => void;
  clearing: boolean;
}

export function SettingsView({ data, onClearCache, clearing }: SettingsViewProps) {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const metrics = data.метрики || { аптайм: '—', обработано: 0, записано: 0, ошибок: 0, в_очереди: 0 };

  useEffect(() => {
    fetchCacheStats()
      .then(setCacheStats)
      .catch(console.error);
  }, []);

  return (
    <>
      {/* Bot Status */}
      <div className="settings-section">
        <div className="settings-title">🤖 Статус бота</div>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Аптайм</label>
            <input type="text" value={metrics.аптайм || '—'} readOnly />
          </div>
          <div className="setting-item">
            <label>Сообщений обработано</label>
            <input type="text" value={metrics.обработано || 0} readOnly />
          </div>
          <div className="setting-item">
            <label>Сообщений записано</label>
            <input type="text" value={metrics.записано || 0} readOnly />
          </div>
          <div className="setting-item">
            <label>Ошибок за час</label>
            <input type="text" value={metrics.ошибок || 0} readOnly />
          </div>
          <div className="setting-item">
            <label>В очереди</label>
            <input type="text" value={metrics.в_очереди || 0} readOnly />
          </div>
        </div>
      </div>

      {/* Cache Stats */}
      {cacheStats && (
        <div className="settings-section">
          <div className="settings-title">📦 Кеш</div>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Дашборд записей</label>
              <input type="text" value={cacheStats.дашборд?.записей || 0} readOnly />
            </div>
            <div className="setting-item">
              <label>TTL дашборда (сек)</label>
              <input type="text" value={cacheStats.дашборд?.ttl_сек || 0} readOnly />
            </div>
            <div className="setting-item">
              <label>Рейтинг актуален</label>
              <input type="text" value={cacheStats.рейтинг?.актуален ? 'Да' : 'Нет'} readOnly />
            </div>
            <div className="setting-item">
              <label>Личная стат записей</label>
              <input type="text" value={cacheStats.личная_стат?.записей || 0} readOnly />
            </div>
            <div className="setting-item">
              <label>Семафор доступно</label>
              <input type="text" value={`${cacheStats.семафор?.доступно || 0}/${cacheStats.семафор?.макс || 5}`} readOnly />
            </div>
            <div className="setting-item">
              <label>Кеш записей</label>
              <input type="text" value={cacheStats.записи?.кеш_записей || 0} readOnly />
            </div>
          </div>
        </div>
      )}

      {/* Cache Clear */}
      <div className="settings-section">
        <div className="settings-title">🧹 Управление кешем</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '12px' }}>
          Очистка кеша приведёт к повторной загрузке данных из Google Sheets.
        </p>
        <button
          className="btn btn-primary"
          onClick={onClearCache}
          disabled={clearing}
        >
          {clearing ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '🗑️'} Очистить весь кеш
        </button>
      </div>

      {/* Formula Info */}
      <div style={{
        background: 'var(--bg-tertiary)',
        borderRadius: '10px',
        padding: '16px',
        marginTop: '12px',
        borderLeft: '4px solid var(--accent)'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
          📐 Формула расчёта
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--accent)' }}>Всего слётов = Тень + Мороз + Вылет</code></p>
          <p><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--accent)' }}>Процент = (Всего слётов / Взяли ТГ) × 100%</code></p>
          <p><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--accent)' }}>Осталось = Взяли ТГ - Всего слётов</code></p>
        </div>
      </div>
    </>
  );
}
