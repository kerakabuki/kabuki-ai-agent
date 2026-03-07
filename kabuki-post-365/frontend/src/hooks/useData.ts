import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useCharacters() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await api.characters.list()); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useImages(params?: Record<string, string>) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await api.images.list(params)); }
    finally { setLoading(false); }
  }, [key]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function usePosts(params?: Record<string, string>) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await api.posts.list(params)); }
    finally { setLoading(false); }
  }, [key]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useCalendar(year: number, month: number) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await api.calendar.getMonth(year, month)); }
    finally { setLoading(false); }
  }, [year, month]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useQuizzes(params?: Record<string, string>) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await api.quiz.list(params)); }
    finally { setLoading(false); }
  }, [key]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useSettings() {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await api.settings.getAll()); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}
