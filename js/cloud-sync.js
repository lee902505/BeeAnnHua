(() => {
  const VERSION = '0.10.7.10';
  const META_KEY = 'stellar-diary-cloud-sync-meta-v1';
  const RESTORE_PENDING_KEY = 'stellar-diary-account-restore-pending-v1';
  const PROFILE_KEY = 'xingchen-player-profile-v1';
  const KEYS = Object.freeze({
    natal: 'xingchen-report-payload-natal-v1',
    synastry: 'xingchen-report-payload-synastry-v1',
    fortune: 'xingchen-fortune-history',
    tarot: 'xingchen-tarot-history-v1'
  });

  let phase = 'idle';
  let lastError = '';
  let lastSyncAt = '';
  let lastReason = '';
  let counts = {profile:0,natal:0,synastry:0,fortune:0,tarot:0};
  let syncPromise = null;
  let initialized = false;
  let applyingRemote = false;
  const timers = new Map();

  function sb() {
    return window.XingchenSupabase?.getClient?.() || null;
  }

  function authUser() {
    return window.XingchenAuth?.getUser?.() || null;
  }

  function signedIn() {
    return Boolean(authUser()?.id);
  }

  function readRestorePending() {
    try { return JSON.parse(localStorage.getItem(RESTORE_PENDING_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function restoreGuardActive() {
    const pending = readRestorePending();
    const user = authUser();
    return Boolean(
      pending && pending.mode === 'existing-login' && !pending.choice && pending.fromUserId &&
      user?.id && pending.fromUserId !== user.id
    );
  }

  function locale() {
    try {
      const value = localStorage.getItem('xingchen-language');
      return ['zh-CN','zh-TW','en'].includes(value) ? value : 'zh-CN';
    } catch (_) { return 'zh-CN'; }
  }

  function timezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'; }
    catch (_) { return 'Asia/Taipei'; }
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? structuredCloneSafe(fallback) : JSON.parse(raw);
    } catch (_) {
      return structuredCloneSafe(fallback);
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) { return false; }
  }

  function structuredCloneSafe(value) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch (_) { return value; }
  }

  function toIso(value, fallback = null) {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toISOString() : fallback;
  }

  function dateTime(value) {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d.getTime() : NaN;
  }

  function text(value, fallback='') {
    return String(value ?? fallback).trim();
  }

  function localizedName(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const lang = locale();
    return value[lang] || value['zh-CN'] || value['zh-TW'] || value.en || Object.values(value)[0] || '';
  }

  function loadMeta() {
    const meta = readJson(META_KEY, {});
    if (meta && typeof meta === 'object') {
      lastSyncAt = text(meta.lastSyncAt);
      lastReason = text(meta.lastReason);
      if (meta.counts && typeof meta.counts === 'object') counts = {...counts, ...meta.counts};
    }
  }

  function saveMeta() {
    writeJson(META_KEY, {version:VERSION,lastSyncAt,lastReason,counts});
  }

  function snapshot() {
    return {
      version: VERSION,
      phase,
      signedIn: signedIn(),
      userId: authUser()?.id || '',
      syncing: phase === 'syncing',
      ready: phase === 'ready' || phase === 'partial',
      lastSyncAt,
      lastReason,
      counts: {...counts},
      error: lastError,
      applyingRemote
    };
  }

  function emit(eventName='stellar:cloud-sync-state', detail=snapshot()) {
    try { window.dispatchEvent(new CustomEvent(eventName, {detail})); } catch (_) {}
    return detail;
  }

  function setState(nextPhase, error='') {
    phase = nextPhase;
    lastError = error ? String(error?.message || error) : '';
    return emit();
  }

  function requireReady() {
    const client = sb();
    const user = authUser();
    if (!client || !user?.id) return null;
    return {client,user};
  }

  function currentReportList(type) {
    const key = type === 'synastry' ? KEYS.synastry : KEYS.natal;
    const list = readJson(key, []);
    return Array.isArray(list) ? list : [];
  }

  function saveReportPayload(type, payload) {
    if (!payload?.meta?.fingerprint) return false;
    if (window.XingchenReportStore?.savePayload) {
      return window.XingchenReportStore.savePayload(type, payload);
    }
    const key = type === 'synastry' ? KEYS.synastry : KEYS.natal;
    const list = currentReportList(type);
    const record = {
      id: payload.meta.fingerprint,
      savedAt: new Date().toISOString(),
      schema: payload.schema,
      schemaVersion: payload.schemaVersion,
      payload
    };
    const next = [record, ...list.filter(item => item?.id !== record.id)].slice(0,5);
    return writeJson(key,next);
  }

  function natalRow(payload, userId) {
    const birth = payload?.birth || {};
    const loc = birth.location || {};
    const date = text(birth.solarDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !payload?.meta?.fingerprint || !payload?.chart) return null;
    const inputSnapshot = {
      schema: payload.schema,
      schemaVersion: payload.schemaVersion,
      reportType: payload.reportType,
      meta: payload.meta,
      subject: payload.subject || null,
      birth,
      method: payload.method || {},
      reportRequest: payload.reportRequest || {}
    };
    return {
      user_id:userId,
      title: payload.subject?.name ? `${payload.subject.name} · ${date}` : `Natal · ${date}`,
      person_name: payload.subject?.name || null,
      calendar_mode: birth.calendarMode === 'lunar' ? 'lunar' : 'solar',
      birth_date: date,
      birth_time: birth.unknownTime ? null : (text(birth.localTime) || null),
      birth_time_unknown: Boolean(birth.unknownTime),
      birth_timezone: loc.timezone || null,
      birth_place_label: localizedName(loc.name) || localizedName(loc.admin2) || localizedName(loc.admin1) || null,
      latitude: Number.isFinite(Number(loc.lat)) ? Number(loc.lat) : null,
      longitude: Number.isFinite(Number(loc.lon)) ? Number(loc.lon) : null,
      input_snapshot: inputSnapshot,
      chart_payload: payload.chart,
      fingerprint: payload.meta.fingerprint,
      schema_version: payload.schemaVersion || '1.0.0',
      engine_version: payload.method?.astronomyEngine || null,
      calculated_at: toIso(payload.meta?.generatedAt, new Date().toISOString())
    };
  }

  function natalPayload(row) {
    const snap = row?.input_snapshot && typeof row.input_snapshot === 'object' ? row.input_snapshot : {};
    return {
      schema:snap.schema || 'stellar-diary.report-input',
      schemaVersion:snap.schemaVersion || row.schema_version || '1.0.0',
      reportType:'natal',
      meta:{...(snap.meta || {}), fingerprint:row.fingerprint, generatedAt:snap.meta?.generatedAt || row.calculated_at || row.created_at},
      subject:snap.subject || {name:row.person_name || null,gender:null},
      birth:snap.birth || {
        calendarMode:row.calendar_mode || 'solar',
        solarDate:row.birth_date,
        localTime:row.birth_time_unknown ? null : row.birth_time,
        unknownTime:Boolean(row.birth_time_unknown),
        location:{name:row.birth_place_label || null,lat:row.latitude,lon:row.longitude,timezone:row.birth_timezone}
      },
      method:snap.method || {},
      chart:row.chart_payload || {},
      reportRequest:snap.reportRequest || {}
    };
  }

  async function syncNatal() {
    const ready = requireReady();
    if (!ready) return {count:0,skipped:'not-signed-in'};
    const {client,user} = ready;
    const local = currentReportList('natal');
    const rows = local.map(entry => natalRow(entry?.payload,user.id)).filter(Boolean);
    if (rows.length) {
      const {error} = await client.from('natal_charts').upsert(rows,{onConflict:'user_id,fingerprint'});
      if (error) throw error;
    }
    const {data,error} = await client.from('natal_charts')
      .select('id,title,person_name,calendar_mode,birth_date,birth_time,birth_time_unknown,birth_timezone,birth_place_label,latitude,longitude,input_snapshot,chart_payload,fingerprint,schema_version,engine_version,calculated_at,created_at,updated_at')
      .eq('user_id',user.id)
      .order('calculated_at',{ascending:false})
      .limit(30);
    if (error) throw error;
    applyingRemote = true;
    try {
      [...(data || [])].reverse().forEach(row => {
        const payload = natalPayload(row);
        if (payload.meta?.fingerprint && payload.chart) saveReportPayload('natal',payload);
      });
    } finally { applyingRemote = false; }
    emit('stellar:cloud-data-updated',{type:'natal',count:(data || []).length});
    return {count:(data || []).length};
  }

  function synastryRow(payload,userId) {
    if (!payload?.meta?.fingerprint || !payload?.people?.A || !payload?.people?.B) return null;
    return {
      user_id:userId,
      title:`${payload.people.A.name || 'A'} × ${payload.people.B.name || 'B'}`,
      relationship_type:payload.relationship?.type || 'dating',
      chart_a_id:null,
      chart_b_id:null,
      person_a:payload.people.A,
      person_b:payload.people.B,
      comparison_payload:{
        schema:payload.schema,
        schemaVersion:payload.schemaVersion,
        reportType:payload.reportType,
        meta:payload.meta,
        method:payload.method || {},
        relationship:payload.relationship || {},
        crossChart:payload.crossChart || {},
        reportRequest:payload.reportRequest || {}
      },
      scores:payload.compatibility || {},
      fingerprint:payload.meta.fingerprint,
      schema_version:payload.schemaVersion || '1.0.0',
      engine_version:payload.method?.astronomyEngine || null,
      calculated_at:toIso(payload.meta?.generatedAt,new Date().toISOString())
    };
  }

  function synastryPayload(row) {
    const comp = row?.comparison_payload && typeof row.comparison_payload === 'object' ? row.comparison_payload : {};
    return {
      schema:comp.schema || 'stellar-diary.report-input',
      schemaVersion:comp.schemaVersion || row.schema_version || '1.0.0',
      reportType:'synastry',
      meta:{...(comp.meta || {}),fingerprint:row.fingerprint,generatedAt:comp.meta?.generatedAt || row.calculated_at || row.created_at},
      method:comp.method || {},
      relationship:comp.relationship || {type:row.relationship_type || 'dating'},
      people:{A:row.person_a || {},B:row.person_b || {}},
      crossChart:comp.crossChart || {},
      compatibility:row.scores || {},
      reportRequest:comp.reportRequest || {}
    };
  }

  async function syncSynastry() {
    const ready = requireReady();
    if (!ready) return {count:0,skipped:'not-signed-in'};
    const {client,user} = ready;
    const local = currentReportList('synastry');
    const rows = local.map(entry => synastryRow(entry?.payload,user.id)).filter(Boolean);
    if (rows.length) {
      const {error} = await client.from('synastry_reports').upsert(rows,{onConflict:'user_id,fingerprint'});
      if (error) throw error;
    }
    const {data,error} = await client.from('synastry_reports')
      .select('id,title,relationship_type,person_a,person_b,comparison_payload,scores,fingerprint,schema_version,engine_version,calculated_at,created_at,updated_at')
      .eq('user_id',user.id)
      .order('calculated_at',{ascending:false})
      .limit(30);
    if (error) throw error;
    applyingRemote = true;
    try {
      [...(data || [])].reverse().forEach(row => {
        const payload = synastryPayload(row);
        if (payload.meta?.fingerprint && payload.people?.A && payload.people?.B) saveReportPayload('synastry',payload);
      });
    } finally { applyingRemote = false; }
    emit('stellar:cloud-data-updated',{type:'synastry',count:(data || []).length});
    return {count:(data || []).length};
  }

  function chooseFortune(localRecord, remoteRecord, remoteRow) {
    if (!localRecord) return remoteRecord || null;
    if (!remoteRecord) return localRecord;
    const lt = dateTime(localRecord.drawnAt);
    const rt = dateTime(remoteRecord.drawnAt || remoteRow?.drawn_at);
    if (Number.isFinite(lt) && Number.isFinite(rt)) return lt <= rt ? localRecord : remoteRecord;
    if (Number.isFinite(rt) && !Number.isFinite(lt)) return remoteRecord;
    return localRecord;
  }

  async function syncFortune() {
    const ready = requireReady();
    if (!ready) return {count:0,skipped:'not-signed-in'};
    const {client,user} = ready;
    const local = readJson(KEYS.fortune, {});
    const localMap = local && typeof local === 'object' && !Array.isArray(local) ? local : {};
    const {data,error} = await client.from('fortune_history')
      .select('fortune_date,fortune_id,timezone,language,fortune_snapshot,drawn_at,created_at,updated_at')
      .eq('user_id',user.id)
      .order('fortune_date',{ascending:false})
      .limit(60);
    if (error) throw error;

    const remoteRows = new Map((data || []).map(row => [row.fortune_date,row]));
    const dates = new Set([...Object.keys(localMap),...(data || []).map(row => row.fortune_date)]);
    const merged = {};
    const rows = [];
    [...dates].sort((a,b) => b.localeCompare(a)).slice(0,60).forEach(date => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      const remoteRow = remoteRows.get(date);
      const remoteRecord = remoteRow?.fortune_snapshot && typeof remoteRow.fortune_snapshot === 'object'
        ? remoteRow.fortune_snapshot
        : null;
      const chosen = chooseFortune(localMap[date],remoteRecord,remoteRow);
      if (!chosen?.id) return;
      if (!chosen.drawnAt) chosen.drawnAt = remoteRow?.drawn_at || new Date().toISOString();
      merged[date] = chosen;
      rows.push({
        user_id:user.id,
        fortune_date:date,
        fortune_id:Number(chosen.id),
        timezone:remoteRow?.timezone || timezone(),
        language:remoteRow?.language || locale(),
        fortune_snapshot:chosen,
        drawn_at:toIso(chosen.drawnAt,remoteRow?.drawn_at || new Date().toISOString())
      });
    });

    applyingRemote = true;
    try { writeJson(KEYS.fortune,merged); }
    finally { applyingRemote = false; }

    if (rows.length) {
      const {error:upsertError} = await client.from('fortune_history').upsert(rows,{onConflict:'user_id,fortune_date'});
      if (upsertError) throw upsertError;
    }
    emit('stellar:cloud-data-updated',{type:'fortune',count:rows.length});
    return {count:rows.length};
  }

  function tarotRow(record,userId) {
    if (!record?.id || !Array.isArray(record.cards) || !record.cards.length) return null;
    return {
      user_id:userId,
      spread_id:record.spreadKey || record.spreadName || 'single',
      topic:record.topicKey || record.topicName || null,
      question:record.question || null,
      person_a_name:null,
      person_b_name:null,
      card_count:Math.min(10,Math.max(1,record.cards.length)),
      cards:record.cards,
      story:record.story || null,
      structure:{text:record.structure || '',signals:Array.isArray(record.signals) ? record.signals : []},
      final_advice:record.finalAdvice || null,
      reading_snapshot:record,
      fingerprint:String(record.id),
      language:locale(),
      reading_at:toIso(record.createdAt,new Date().toISOString())
    };
  }

  async function upsertTarotRecord(client,row,userId) {
    const {data:existing,error:findError} = await client.from('tarot_history')
      .select('id')
      .eq('user_id',userId)
      .eq('fingerprint',row.fingerprint)
      .limit(1)
      .maybeSingle();
    if (findError) throw findError;
    if (existing?.id) {
      const {error} = await client.from('tarot_history').update(row).eq('id',existing.id).eq('user_id',userId);
      if (error) throw error;
      return;
    }
    const {error} = await client.from('tarot_history').insert(row);
    if (error && error.code !== '23505') throw error;
  }

  async function syncTarot() {
    const ready = requireReady();
    if (!ready) return {count:0,skipped:'not-signed-in'};
    const {client,user} = ready;
    const local = readJson(KEYS.tarot, []);
    const localList = Array.isArray(local) ? local.slice(0,10) : [];
    for (const record of localList) {
      const row = tarotRow(record,user.id);
      if (row) await upsertTarotRecord(client,row,user.id);
    }
    const {data,error} = await client.from('tarot_history')
      .select('reading_snapshot,fingerprint,reading_at,created_at')
      .eq('user_id',user.id)
      .order('reading_at',{ascending:false})
      .limit(50);
    if (error) throw error;

    const merged = new Map();
    localList.forEach(record => { if (record?.id) merged.set(String(record.id),record); });
    (data || []).forEach(row => {
      const record = row.reading_snapshot;
      const id = String(record?.id || row.fingerprint || '');
      if (!id || !record || typeof record !== 'object') return;
      const prev = merged.get(id);
      if (!prev || (dateTime(record.createdAt || row.reading_at) > dateTime(prev.createdAt))) merged.set(id,record);
    });
    const next = [...merged.values()]
      .sort((a,b) => (dateTime(b.createdAt) || 0) - (dateTime(a.createdAt) || 0))
      .slice(0,10);
    applyingRemote = true;
    try { writeJson(KEYS.tarot,next); }
    finally { applyingRemote = false; }
    emit('stellar:cloud-data-updated',{type:'tarot',count:next.length});
    return {count:next.length};
  }

  async function syncProfile() {
    if (!window.XingchenAuth?.syncProfile) return {count:0,skipped:'unavailable'};
    const result = await window.XingchenAuth.syncProfile(true);
    if (!result.ok) throw result.error || new Error('Profile sync failed.');
    return {count:result.skipped === 'no-local-profile' ? 0 : 1};
  }

  async function runPart(name, fn, result, errors) {
    try {
      const value = await fn();
      result[name] = value;
      counts[name] = Number(value?.count || 0);
    } catch (error) {
      console.warn(`[星辰日记] 云端同步 ${name} 失败：`,error);
      errors.push({name,message:String(error?.message || error)});
      result[name] = {count:0,error:String(error?.message || error)};
    }
  }

  async function syncAll(reason='manual') {
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      if (!signedIn()) {
        return setState('waiting-auth','尚未建立云端身份。');
      }
      if (restoreGuardActive() && !/^restore-(merge|cloud)/.test(reason)) {
        return setState('restore-choice','等待选择如何处理这台设备的游客资料。');
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return setState('offline','目前离线；本机资料已保留，恢复网络后会自动重试。');
      }
      setState('syncing','');
      const result = {};
      const errors = [];
      await runPart('profile',syncProfile,result,errors);
      await runPart('natal',syncNatal,result,errors);
      await runPart('synastry',syncSynastry,result,errors);
      await runPart('fortune',syncFortune,result,errors);
      await runPart('tarot',syncTarot,result,errors);
      lastSyncAt = new Date().toISOString();
      lastReason = reason;
      saveMeta();
      if (errors.length) {
        phase = 'partial';
        lastError = errors.map(e => `${e.name}: ${e.message}`).join(' | ');
      } else {
        phase = 'ready';
        lastError = '';
      }
      emit();
      emit('stellar:cloud-sync-complete',{...snapshot(),result,errors});
      return {...snapshot(),result,errors};
    })().finally(() => { syncPromise = null; });
    return syncPromise;
  }

  async function syncType(type,reason='record-change') {
    if (!signedIn() || applyingRemote) return {ok:false,skipped:'not-ready'};
    if (restoreGuardActive()) return {ok:false,skipped:'restore-choice'};
    const map = {profile:syncProfile,natal:syncNatal,synastry:syncSynastry,fortune:syncFortune,tarot:syncTarot};
    const fn = map[type];
    if (!fn) return {ok:false,skipped:'unknown-type'};
    try {
      setState('syncing','');
      const result = await fn();
      counts[type] = Number(result?.count || 0);
      lastSyncAt = new Date().toISOString();
      lastReason = reason;
      saveMeta();
      setState('ready','');
      emit('stellar:cloud-sync-complete',{...snapshot(),result:{[type]:result},errors:[]});
      return {ok:true,result};
    } catch (error) {
      setState('partial',error);
      return {ok:false,error};
    }
  }

  function schedule(type,delay=850) {
    if (applyingRemote) return;
    const old = timers.get(type);
    if (old) clearTimeout(old);
    timers.set(type,setTimeout(() => {
      timers.delete(type);
      syncType(type).catch(() => {});
    },delay));
  }

  async function clearTarotCloud() {
    const ready = requireReady();
    if (!ready) return {ok:false,skipped:'not-signed-in'};
    const {client,user} = ready;
    const {error} = await client.from('tarot_history').delete().eq('user_id',user.id);
    if (error) return {ok:false,error};
    counts.tarot = 0;
    lastSyncAt = new Date().toISOString();
    lastReason = 'tarot-clear';
    saveMeta();
    emit();
    return {ok:true};
  }

  function bindEvents() {
    window.addEventListener('stellar:auth-state', event => {
      if (event.detail?.signedIn) {
        if (restoreGuardActive()) setState('restore-choice','等待选择如何处理这台设备的游客资料。');
        else setTimeout(() => syncAll('auth-ready'),250);
      } else if (event.detail?.phase === 'signed-out') {
        setState('waiting-auth','');
      }
    });
    window.addEventListener('stellar:player-profile-saved',() => schedule('profile',250));
    window.addEventListener('stellar:local-record-write',event => {
      if (applyingRemote) return;
      const key = event.detail?.key;
      if (key === KEYS.tarot) schedule('tarot');
      if (key === KEYS.natal) schedule('natal');
      if (key === KEYS.synastry) schedule('synastry');
    });
    window.addEventListener('stellar:fortune-local-changed',() => schedule('fortune',450));
    document.addEventListener('xingchen:report-payload-ready',event => {
      const type = event.detail?.type;
      if (type === 'natal' || type === 'synastry') schedule(type,300);
    });
    window.addEventListener('online',() => setTimeout(() => syncAll('online'),300));
    window.addEventListener('offline',() => setState('offline','目前离线；本机资料会继续保留。'));
  }

  function init() {
    if (initialized) return snapshot();
    initialized = true;
    loadMeta();
    bindEvents();
    const auth = window.XingchenAuth?.status?.() || {};
    if (auth.signedIn) {
      if (restoreGuardActive()) setState('restore-choice','等待选择如何处理这台设备的游客资料。');
      else setTimeout(() => syncAll('startup'),180);
    } else setState(auth.phase === 'local-only' ? 'local-only' : 'waiting-auth','');
    return snapshot();
  }


  async function restoreFromCloud(reason='restore-cloud') {
    const ready = requireReady();
    if (!ready) return setState('waiting-auth','尚未建立云端身份。');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return setState('offline','目前离线；请联网后再恢复云端资料。');
    }
    const {client,user} = ready;
    setState('syncing','');
    const errors = [];
    const result = {};
    applyingRemote = true;
    try {
      // Profile: cloud is authoritative during an explicit restore.
      try {
        const {data,error} = await client.from('profiles')
          .select('display_name,sex,locale,timezone')
          .eq('id',user.id)
          .maybeSingle();
        if (error) throw error;
        if (data?.display_name && ['male','female'].includes(data.sex)) {
          writeJson(PROFILE_KEY,{name:data.display_name,gender:data.sex});
          try { if (data.locale) localStorage.setItem('xingchen-language',data.locale); } catch (_) {}
          result.profile = {count:1}; counts.profile = 1;
        } else { result.profile = {count:0}; counts.profile = 0; }
      } catch (error) { errors.push({name:'profile',message:String(error?.message||error)}); }

      // Natal charts: replace local report cache with remote rows.
      try {
        const {data,error} = await client.from('natal_charts')
          .select('id,title,person_name,calendar_mode,birth_date,birth_time,birth_time_unknown,birth_timezone,birth_place_label,latitude,longitude,input_snapshot,chart_payload,fingerprint,schema_version,engine_version,calculated_at,created_at,updated_at')
          .eq('user_id',user.id)
          .order('calculated_at',{ascending:false})
          .limit(30);
        if (error) throw error;
        writeJson(KEYS.natal,[]);
        [...(data||[])].reverse().forEach(row => {
          const payload = natalPayload(row);
          if (payload.meta?.fingerprint && payload.chart) saveReportPayload('natal',payload);
        });
        result.natal={count:(data||[]).length}; counts.natal=(data||[]).length;
        emit('stellar:cloud-data-updated',{type:'natal',count:counts.natal});
      } catch (error) { errors.push({name:'natal',message:String(error?.message||error)}); }

      // Synastry: replace local report cache with remote rows.
      try {
        const {data,error} = await client.from('synastry_reports')
          .select('id,title,relationship_type,person_a,person_b,comparison_payload,scores,fingerprint,schema_version,engine_version,calculated_at,created_at,updated_at')
          .eq('user_id',user.id)
          .order('calculated_at',{ascending:false})
          .limit(30);
        if (error) throw error;
        writeJson(KEYS.synastry,[]);
        [...(data||[])].reverse().forEach(row => {
          const payload = synastryPayload(row);
          if (payload.meta?.fingerprint && payload.people?.A && payload.people?.B) saveReportPayload('synastry',payload);
        });
        result.synastry={count:(data||[]).length}; counts.synastry=(data||[]).length;
        emit('stellar:cloud-data-updated',{type:'synastry',count:counts.synastry});
      } catch (error) { errors.push({name:'synastry',message:String(error?.message||error)}); }

      // Daily fortunes: cloud copy replaces guest-local history for restore mode.
      try {
        const {data,error} = await client.from('fortune_history')
          .select('fortune_date,fortune_id,fortune_snapshot,drawn_at')
          .eq('user_id',user.id)
          .order('fortune_date',{ascending:false})
          .limit(60);
        if (error) throw error;
        const map={};
        (data||[]).forEach(row => {
          if (!row?.fortune_date) return;
          const record = row.fortune_snapshot && typeof row.fortune_snapshot==='object'
            ? {...row.fortune_snapshot}
            : {id:row.fortune_id};
          if (!record.drawnAt) record.drawnAt = row.drawn_at || new Date().toISOString();
          map[row.fortune_date]=record;
        });
        writeJson(KEYS.fortune,map);
        result.fortune={count:(data||[]).length}; counts.fortune=(data||[]).length;
        emit('stellar:cloud-data-updated',{type:'fortune',count:counts.fortune});
      } catch (error) { errors.push({name:'fortune',message:String(error?.message||error)}); }

      // Tarot history: cloud copy replaces guest-local history for restore mode.
      try {
        const {data,error} = await client.from('tarot_history')
          .select('reading_snapshot,fingerprint,reading_at,created_at')
          .eq('user_id',user.id)
          .order('reading_at',{ascending:false})
          .limit(50);
        if (error) throw error;
        const next=(data||[])
          .map(row => row.reading_snapshot)
          .filter(v => v && typeof v==='object')
          .sort((a,b)=>(dateTime(b.createdAt)||0)-(dateTime(a.createdAt)||0))
          .slice(0,10);
        writeJson(KEYS.tarot,next);
        result.tarot={count:next.length}; counts.tarot=next.length;
        emit('stellar:cloud-data-updated',{type:'tarot',count:counts.tarot});
      } catch (error) { errors.push({name:'tarot',message:String(error?.message||error)}); }
    } finally {
      applyingRemote = false;
    }

    lastSyncAt = new Date().toISOString();
    lastReason = reason;
    saveMeta();
    if (errors.length) {
      phase='partial';
      lastError=errors.map(e=>`${e.name}: ${e.message}`).join(' | ');
    } else {
      phase='ready';
      lastError='';
    }
    emit();
    emit('stellar:cloud-sync-complete',{...snapshot(),result,errors});
    return {...snapshot(),result,errors};
  }

  window.XingchenCloudSync = Object.freeze({
    init,
    syncAll,
    syncType,
    restoreFromCloud,
    clearTarotCloud,
    status:snapshot,
    isApplyingRemote:() => applyingRemote
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else {
    init();
  }
})();
