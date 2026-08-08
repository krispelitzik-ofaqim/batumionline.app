import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../constants/i18n';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { fetchContent } from '../constants/api';

type Result = {
  id: string;
  title: string;
  path: string;
  parentTitle?: string;
  categoryTitle?: string;
  icon?: string;
};

export default function SearchModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (visible && !data) {
      fetchContent().then(setData).catch(() => {});
    }
    if (!visible) setQuery('');
  }, [visible, data]);

  const results: Result[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !data) return [];
    const out: Result[] = [];
    const matches = (s?: string) => (s || '').toLowerCase().includes(q);

    const allCats = [...(data.mainCategories || []), ...(data.extraCategories || [])];
    for (const c of allCats) {
      if (matches(c.title) || matches(c.subtitle) || matches(c.description)) {
        out.push({ id: c.id, title: c.title, path: `/category/${c.id}`, icon: c.icon });
      }
      for (const child of c.children || []) {
        if (matches(child.title) || matches(child.subtitle)) {
          out.push({ id: child.id, title: child.title, path: `/category/${child.id}`, parentTitle: c.title, icon: child.icon });
        }
        for (const h of child.hotels || []) {
          if (matches(h.title) || matches(h.titleEn) || matches(h.text)) {
            out.push({ id: `${child.id}:${h.id}`, title: h.title, path: `/category/${child.id}`, parentTitle: child.title, categoryTitle: c.title });
          }
        }
        for (const t of child.tours || []) {
          if (matches(t.title) || matches(t.text)) {
            out.push({ id: `${child.id}:${t.id}`, title: t.title, path: `/category/${child.id}`, parentTitle: child.title });
          }
        }
      }
      for (const h of c.hotels || []) {
        if (matches(h.title) || matches(h.titleEn) || matches(h.text)) {
          out.push({ id: `${c.id}:${h.id}`, title: h.title, path: `/category/${c.id}`, parentTitle: c.title });
        }
      }
      for (const t of c.tours || []) {
        if (matches(t.title) || matches(t.text)) {
          out.push({ id: `${c.id}:${t.id}`, title: t.title, path: `/category/${c.id}`, parentTitle: c.title });
        }
      }
    }

    // Portals
    if (matches('פורטל הנדל"ן') || matches('נדל"ן') || matches('דירות') || matches('מכירה') || matches('השכרה') || matches('פרויקט')) {
      out.push({ id: 'portal_re', title: 'פורטל הנדל״ן', path: '/portal/realestate', icon: '🏠' });
    }
    if (matches('פורטל העסקים') || matches('עסקים') || matches('בנק') || matches('עורך דין')) {
      out.push({ id: 'portal_biz', title: 'פורטל העסקים', path: '/portal/business', icon: '💼' });
    }
    if (matches('מתווך') || matches('מתווכים')) {
      out.push({ id: 'portal_brokers', title: 'מתווכים מומלצים', path: '/portal/brokers', icon: '🤝' });
    }

    // Curated listings
    for (const tab of ['sale', 'rent', 'hotels']) {
      const list = (data.curatedListings || {})[tab] || [];
      for (const lst of list) {
        if (matches(lst.title) || matches(lst.location) || matches((lst.features || []).join(' '))) {
          out.push({ id: `curated:${lst.id}`, title: lst.title, path: '/portal/realestate' as any, parentTitle: tab === 'sale' ? 'דירות למכירה' : tab === 'rent' ? 'דירות להשכרה' : 'פרויקטים מלונאיים' });
        }
      }
    }

    // Future projects
    for (const f of (data.futureProjects || [])) {
      if (matches(f.title) || matches(f.article) || matches((f.features || []).join(' '))) {
        out.push({ id: `future:${f.id}`, title: f.title, path: '/portal/realestate' as any, parentTitle: 'עתיד הנדל״ן' });
      }
    }

    // News
    if (matches('חדשות')) {
      out.push({ id: 'news_section', title: 'חדשות נדל״ן', path: '/portal/realestate' as any, icon: '📰' });
    }
    for (const cat of (data.realEstate?.newsCategories || [])) {
      if (matches(cat.title)) {
        out.push({ id: `news_cat:${cat.id}`, title: cat.title, path: '/portal/realestate' as any, parentTitle: 'חדשות נדל״ן', icon: cat.icon });
      }
      for (const n of (cat.items || [])) {
        if (matches(n.title) || matches(n.summary) || matches(n.article)) {
          out.push({ id: `news:${n.id}`, title: n.title, path: '/portal/realestate' as any, parentTitle: cat.title });
        }
      }
    }

    // Articles
    for (const a of (data.realEstateArticles || [])) {
      if (matches(a.title) || matches(a.summary) || matches(a.article)) {
        out.push({ id: `art:${a.id}`, title: a.title, path: '/portal/realestate' as any, parentTitle: 'כתבות וטיפים' });
      }
    }

    // Brokers
    for (const b of (data.brokers || [])) {
      if (matches(b.name) || matches(b.title) || matches(b.description) || matches(b.city)) {
        out.push({ id: `broker:${b.id}`, title: b.name, path: '/portal/brokers' as any, parentTitle: 'מתווכים' });
      }
    }

    return out.slice(0, 50);
  }, [query, data]);

  const open = (r: Result) => {
    onClose();
    router.push(r.path as any);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.inputRow}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.input}
            value={query}
            onChangeText={setQuery}
            placeholder={t('srch.ph')}
            placeholderTextColor="#9ca3af"
            autoFocus
          />
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeTxt}>{t('c.close')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
          {!query.trim() && (
            <Text style={s.hint}>{t('srch.hint')}</Text>
          )}
          {query.trim() && results.length === 0 && (
            <Text style={s.hint}>{
              lang === 'en' ? `No results found for "${query}"`
              : lang === 'fa' ? `نتیجه‌ای برای "${query}" یافت نشد`
              : lang === 'ru' ? `Ничего не найдено по запросу "${query}"`
              : `לא נמצאו תוצאות עבור "${query}"`
            }</Text>
          )}
          {results.map((r, i) => (
            <TouchableOpacity key={`${r.id}-${i}`} style={s.item} onPress={() => open(r)}>
              {r.icon ? <Text style={s.itemIcon}>{r.icon}</Text> : <Text style={s.itemIcon}>📍</Text>}
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle} numberOfLines={1}>{r.title}</Text>
                {(r.parentTitle || r.categoryTitle) && (
                  <Text style={s.itemPath} numberOfLines={1}>
                    {r.categoryTitle ? `${r.categoryTitle} · ` : ''}{r.parentTitle || ''}
                  </Text>
                )}
              </View>
              <Text style={s.arrow}>‹</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: Colors.WHITE,
    paddingTop: 50,
    padding: 14,
  },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginBottom: 10 },
  inputRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    marginBottom: 10,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', paddingVertical: 6 },
  closeBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  closeTxt: { fontSize: 12, color: Colors.PRIMARY, fontWeight: '800' },
  hint: { fontSize: 12, color: '#94a3b8', textAlign: 'center', writingDirection: 'rtl', paddingVertical: 20 },
  item: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  itemIcon: { fontSize: 18 },
  itemTitle: { fontSize: 14, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  itemPath: { fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  arrow: { fontSize: 22, color: '#cbd5e1', fontWeight: '300' },
});
