import { useCallback, useEffect, useMemo, useState } from 'react';
import { hostelsAPI } from '../services/api';

let cachedHostels = null;
let inFlightHostelsRequest = null;

async function fetchHostelsOnce() {
  if (Array.isArray(cachedHostels)) return cachedHostels;
  if (inFlightHostelsRequest) return inFlightHostelsRequest;

  inFlightHostelsRequest = hostelsAPI
    .getAll()
    .then((res) => {
      cachedHostels = res.data.hostels || [];
      return cachedHostels;
    })
    .catch(() => {
      cachedHostels = [];
      return cachedHostels;
    })
    .finally(() => {
      inFlightHostelsRequest = null;
    });

  return inFlightHostelsRequest;
}

export default function useHostelNameMap() {
  const [hostels, setHostels] = useState(() => (Array.isArray(cachedHostels) ? cachedHostels : []));

  useEffect(() => {
    let cancelled = false;

    fetchHostelsOnce().then((list) => {
      if (!cancelled) setHostels(list);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const hostelNameByBlock = useMemo(() => {
    const map = new Map();
    hostels.forEach((h) => {
      if (h?.block_code) {
        const norm = String(h.block_code).replace(/BLOCK_/i, '').trim().toUpperCase();
        map.set(norm, h.name || 'Unnamed Hostel');
      }
    });
    return map;
  }, [hostels]);

  const getHostelName = useCallback((blockCode) => {
    if (!blockCode) return '-';
    const norm = String(blockCode).replace(/BLOCK_/i, '').trim().toUpperCase();
    return hostelNameByBlock.get(norm) || 'Unknown Hostel';
  }, [hostelNameByBlock]);

  return { hostels, hostelNameByBlock, getHostelName };
}

