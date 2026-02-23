import { useState, useCallback } from 'react';
import OSDesktopIcon from './OSDesktopIcon';
import { appRegistry } from './osAppRegistry';
import type { AppDefinition, ContextMenuEntry } from './types';

interface OSDesktopProps {
  onOpenApp: (app: AppDefinition) => void;
  onContextMenu: (x: number, y: number, items: ContextMenuEntry[]) => void;
}

const TASKBAR_HEIGHT = 56;
const ICON_W = 80;
const ICON_H = 88;
const PAD = 16;
const STORAGE_KEY = 'os_icon_positions';

type Positions = Record<string, { x: number; y: number }>;

function buildDefaultPositions(): Positions {
  const positions: Positions = {};
  const maxRows = Math.max(1, Math.floor((window.innerHeight - TASKBAR_HEIGHT - PAD * 2) / ICON_H));
  appRegistry.forEach((app, i) => {
    const col = Math.floor(i / maxRows);
    const row = i % maxRows;
    positions[app.id] = {
      x: PAD + col * ICON_W,
      y: PAD + row * ICON_H,
    };
  });
  return positions;
}

function buildSortedPositions(): Positions {
  const sorted = [...appRegistry].sort((a, b) => a.label.localeCompare(b.label));
  const positions: Positions = {};
  const maxRows = Math.max(1, Math.floor((window.innerHeight - TASKBAR_HEIGHT - PAD * 2) / ICON_H));
  sorted.forEach((app, i) => {
    const col = Math.floor(i / maxRows);
    const row = i % maxRows;
    positions[app.id] = {
      x: PAD + col * ICON_W,
      y: PAD + row * ICON_H,
    };
  });
  return positions;
}

function loadPositions(): Positions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Positions;
      const allPresent = appRegistry.every(a => parsed[a.id]);
      if (allPresent) return parsed;
    }
  } catch { /* ignore */ }
  return buildDefaultPositions();
}

function savePositions(positions: Positions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

export default function OSDesktop({ onOpenApp, onContextMenu }: OSDesktopProps) {
  const [positions, setPositions] = useState<Positions>(loadPositions);

  const handleMove = useCallback((appId: string, x: number, y: number) => {
    setPositions(prev => {
      const next = { ...prev, [appId]: { x, y } };
      savePositions(next);
      return next;
    });
  }, []);

  const handleDesktopContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu(e.clientX, e.clientY, [
        {
          type: 'item',
          label: 'Sort by name',
          onClick: () => {
            const sorted = buildSortedPositions();
            savePositions(sorted);
            setPositions(sorted);
          },
        },
        {
          type: 'item',
          label: 'Reset icon layout',
          onClick: () => {
            const defaults = buildDefaultPositions();
            savePositions(defaults);
            setPositions(defaults);
          },
        },
        { type: 'divider' },
        {
          type: 'item',
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      ]);
    },
    [onContextMenu]
  );

  const handleIconContextMenu = useCallback(
    (app: AppDefinition, x: number, y: number) => {
      onContextMenu(x, y, [
        {
          type: 'item',
          label: 'Open',
          onClick: () => onOpenApp(app),
        },
        { type: 'divider' },
        {
          type: 'item',
          label: 'Reset position',
          onClick: () => {
            const defaults = buildDefaultPositions();
            const defaultPos = defaults[app.id];
            if (defaultPos) {
              setPositions(prev => {
                const next = { ...prev, [app.id]: defaultPos };
                savePositions(next);
                return next;
              });
            }
          },
        },
      ]);
    },
    [onContextMenu, onOpenApp]
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #0f0c29 100%)',
        paddingBottom: TASKBAR_HEIGHT,
      }}
      onContextMenu={handleDesktopContextMenu}
    >
      {appRegistry.map(app => (
        <OSDesktopIcon
          key={app.id}
          app={app}
          x={positions[app.id]?.x ?? 0}
          y={positions[app.id]?.y ?? 0}
          onOpen={onOpenApp}
          onMove={handleMove}
          onContextMenu={handleIconContextMenu}
        />
      ))}
    </div>
  );
}
