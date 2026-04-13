import { useEffect, useMemo, useState } from 'react';
import { hostelsAPI } from '../services/api';

export default function useHostelNameMap() {
  const [hostels, setHostels] = useState([]);

  useEffect(() => {
    hostelsAPI.getAll()
      .then((res) => setHostels(res.data.hostels || []))
      .catch(() => setHostels([]));
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

  const getHostelName = (blockCode) => {
    if (!blockCode) return '-';
    const norm = String(blockCode).replace(/BLOCK_/i, '').trim().toUpperCase();
    return hostelNameByBlock.get(norm) || 'Unknown Hostel';
  };

  return { hostels, hostelNameByBlock, getHostelName };
}

