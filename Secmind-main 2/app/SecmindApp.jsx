'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { CAPABILITY_DETAILS } from './capability-data';

/* Minimal inline SVG icon set (lucide-style stroke). Returns React components. */
const _iconBase = {
  width: 16, height: 16, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.75,
  strokeLinecap: 'round', strokeLinejoin: 'round'
};
const Ic = (paths) => ({ size = 16, className = '', style, ...rest }) => (
  <svg {..._iconBase} width={size} height={size} className={className} style={style} {...rest}>
    {paths}
  </svg>
);

const IconDashboard = Ic(<><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>);
const IconAlert     = Ic(<><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/></>);
const IconSearch    = Ic(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>);
const IconDatabase  = Ic(<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>);
const IconSettings  = Ic(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>);
const IconBell      = Ic(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>);
const IconShield    = Ic(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>);
const IconCheck     = Ic(<><path d="M20 6 9 17l-5-5"/></>);
const IconClose     = Ic(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>);
const IconClock     = Ic(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>);
const IconChevR     = Ic(<><path d="m9 18 6-6-6-6"/></>);
const IconChevL     = Ic(<><path d="m15 18-6-6 6-6"/></>);
const IconChevD     = Ic(<><path d="m6 9 6 6 6-6"/></>);
const IconChevU     = Ic(<><path d="m18 15-6-6-6 6"/></>);
const IconPlus      = Ic(<><path d="M12 5v14"/><path d="M5 12h14"/></>);
const IconFilter    = Ic(<><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></>);
const IconUser      = Ic(<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>);
const IconBrain     = Ic(<><path d="M12 5a3 3 0 0 0-5.9-.8 3 3 0 0 0-2 5.1A3 3 0 0 0 4 14.5a3 3 0 0 0 2.5 4.5 3 3 0 0 0 5.5 0V5z"/><path d="M12 5a3 3 0 0 1 5.9-.8 3 3 0 0 1 2 5.1A3 3 0 0 1 20 14.5a3 3 0 0 1-2.5 4.5 3 3 0 0 1-5.5 0"/></>);
const IconTarget    = Ic(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/></>);
const IconActivity  = Ic(<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>);
const IconTrend     = Ic(<><path d="M22 17 13.5 8.5 8.5 13.5 2 7"/><path d="M16 17h6v-6"/></>);
const IconZap       = Ic(<><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></>);
const IconPlay      = Ic(<><polygon points="6 3 20 12 6 21 6 3"/></>);
const IconPause     = Ic(<><rect x="6" y="4" width="4" height="16" rx="0.5"/><rect x="14" y="4" width="4" height="16" rx="0.5"/></>);
const IconRefresh   = Ic(<><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></>);
const IconLoader    = Ic(<><path d="M12 3v3"/><path d="M16.5 7.5 18.6 5.4"/><path d="M18 12h3"/><path d="m16.5 16.5 2.1 2.1"/><path d="M12 18v3"/><path d="m5.4 18.6 2.1-2.1"/><path d="M3 12h3"/><path d="m5.4 5.4 2.1 2.1"/></>);
const IconShare     = Ic(<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/></>);
const IconDownload  = Ic(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>);
const IconUpload    = Ic(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></>);
const IconFish      = Ic(<><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6z"/><path d="M18 12v.5"/><path d="M16 18.5 21 22l-1-5"/><path d="M2 8s3 4 6 4-6 4-6 4"/></>);
const IconMonitor   = Ic(<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></>);
const IconGlobe     = Ic(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/></>);
const IconCloud     = Ic(<><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9A6 6 0 0 0 3 13a5 5 0 0 0 5 6h9.5z"/></>);
const IconKey       = Ic(<><circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 8.5-8.5"/><path d="m16 10 3 3"/><path d="m13 13 3 3"/></>);
const IconMail      = Ic(<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></>);
const IconMore      = Ic(<><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>);
const IconEdit      = Ic(<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></>);
const IconTrash     = Ic(<><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>);
const IconCopy      = Ic(<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>);
const IconExternal  = Ic(<><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>);
const IconHash      = Ic(<><path d="M4 9h16"/><path d="M4 15h16"/><path d="m10 3-2 18"/><path d="m16 3-2 18"/></>);
const IconHistory   = Ic(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>);
const IconNetwork   = Ic(<><rect x="9" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M12 9v3"/><path d="M6 15v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></>);
const IconFile      = Ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>);
const IconCalendar  = Ic(<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></>);
const IconWebhook   = Ic(<><path d="M18 16.98h-5.99c-1.66 0-3.01 1.34-3.01 3s1.34 3 3.01 3 3-1.34 3-3"/><path d="m7.5 16.98 3-5.2"/><path d="M21 12.04A9 9 0 0 0 8 4.05"/><path d="M3 12a9 9 0 0 0 8.92 9"/></>);
const IconServer    = Ic(<><rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01"/><path d="M6 17h.01"/></>);
const IconHardDrive = Ic(<><path d="M22 12H2"/><path d="M5.5 6h13L22 12v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5z"/><path d="M6 16h.01"/><path d="M10 16h.01"/></>);
const IconCpu       = Ic(<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 15h3"/><path d="M1 9h3"/><path d="M1 15h3"/></>);
const IconBack      = Ic(<><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>);
const IconMessage   = Ic(<><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></>);
const IconThumbUp   = Ic(<><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7v-12L13 2l1.7.85a2 2 0 0 1 1.07 2.22z"/></>);
const IconThumbDown = Ic(<><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17v12l-6 8-1.7-.85a2 2 0 0 1-1.07-2.22z"/></>);
const IconEye       = Ic(<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>);
const IconLock      = Ic(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>);
const IconMoon      = Ic(<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>);
const IconSun       = Ic(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></>);
const IconCommand   = Ic(<><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></>);
const IconArrowR    = Ic(<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>);
const IconLink      = Ic(<><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1L11.5 5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1L12.5 19"/></>);

const Icons = {
  Dashboard: IconDashboard, Alert: IconAlert, Search: IconSearch, Database: IconDatabase,
  Settings: IconSettings, Bell: IconBell, Shield: IconShield, Check: IconCheck, Close: IconClose,
  Clock: IconClock, ChevR: IconChevR, ChevL: IconChevL, ChevD: IconChevD, ChevU: IconChevU,
  Plus: IconPlus, Filter: IconFilter, User: IconUser, Brain: IconBrain, Target: IconTarget,
  Activity: IconActivity, Trend: IconTrend, Zap: IconZap, Play: IconPlay, Pause: IconPause,
  Refresh: IconRefresh, Loader: IconLoader, Share: IconShare, Download: IconDownload,
  Upload: IconUpload, Fish: IconFish, Monitor: IconMonitor, Globe: IconGlobe, Cloud: IconCloud,
  Key: IconKey, Mail: IconMail, More: IconMore, Edit: IconEdit, Trash: IconTrash, Copy: IconCopy,
  External: IconExternal, Hash: IconHash, History: IconHistory, Network: IconNetwork,
  File: IconFile, Calendar: IconCalendar, Webhook: IconWebhook, Server: IconServer,
  HardDrive: IconHardDrive, Cpu: IconCpu, Back: IconBack, Message: IconMessage,
  ThumbUp: IconThumbUp, ThumbDown: IconThumbDown, Eye: IconEye, Lock: IconLock,
  Moon: IconMoon, Sun: IconSun, Command: IconCommand, ArrowR: IconArrowR, Link: IconLink,
};

/* Runnable P0 capabilities — used to show/hide the try-run button */
const RUNNABLE_CAPABILITIES = new Set(["A1", "B8", "E2", "F1", "F4", "F8"]);

/* Lightweight shadcn-style primitives. */
const { useState, useRef, useEffect } = React;

function cx(...args) { return args.filter(Boolean).join(' '); }

// Card
const Card = ({ className, children, style }) => (
  <div className={cx('card', className)} style={style}>{children}</div>
);

// Button
const Button = ({ variant='default', size='md', className, leftIcon, rightIcon, children, ...rest }) => {
  const cls = cx('btn',
    variant === 'primary' && 'btn-primary',
    variant === 'ghost' && 'btn-ghost',
    variant === 'brand' && 'btn-brand',
    variant === 'icon' && 'btn-icon',
    size === 'sm' && 'btn-sm',
    size === 'icon-sm' && 'btn-icon-sm',
    className
  );
  return <button className={cls} {...rest}>{leftIcon}{children}{rightIcon}</button>;
};

// Badge — variants: default, muted, solid, tone (success/warning/destructive/info)
const tonePalette = {
  critical:    { fg:'#b91c1c', bg:'#fef2f2', bd:'#fecaca' },
  high:        { fg:'#c2410c', bg:'#fff7ed', bd:'#fed7aa' },
  medium:      { fg:'#a16207', bg:'#fefce8', bd:'#fde68a' },
  low:         { fg:'#15803d', bg:'#f0fdf4', bd:'#bbf7d0' },
  info:        { fg:'#1d4ed8', bg:'#eff6ff', bd:'#bfdbfe' },
  neutral:     { fg:'#3f3f46', bg:'#fafafa', bd:'#e4e4e7' },
  purple:      { fg:'#6d28d9', bg:'#f5f3ff', bd:'#ddd6fe' },
  destructive: { fg:'#b91c1c', bg:'#fef2f2', bd:'#fecaca' },
  success:     { fg:'#15803d', bg:'#f0fdf4', bd:'#bbf7d0' },
  warning:     { fg:'#c2410c', bg:'#fff7ed', bd:'#fed7aa' },
};

const Badge = ({ tone, variant='default', className, style, children }) => {
  let s = style || {};
  if (tone && tonePalette[tone]) {
    const p = tonePalette[tone];
    s = { color: p.fg, background: p.bg, borderColor: p.bd, ...s };
  }
  const cls = cx('badge', variant === 'muted' && 'badge-muted', variant === 'solid' && 'badge-solid', className);
  return <span className={cls} style={s}>{children}</span>;
};

// Dot — small colored circle for status
const Dot = ({ tone='neutral', size=8, pulse=false, style }) => {
  const p = tonePalette[tone] || tonePalette.neutral;
  return <span className={pulse ? 'pulse-dot' : ''} style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:p.fg, ...style }} />;
};

// Avatar — initials in a circle
const Avatar = ({ name='?', size=24, className, style }) => (
  <span className={cx(className)} style={{
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:size, height:size, borderRadius:'50%',
    background:'var(--accent)', color:'var(--foreground)',
    fontSize: size <= 24 ? 11 : 13, fontWeight:600,
    border:'1px solid var(--border)', ...style,
  }}>{name.slice(0,1)}</span>
);

// Input
const Input = ({ className, leftIcon, ...rest }) => {
  if (leftIcon) {
    return (
      <div style={{ position:'relative', width:'100%' }}>
        <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted-foreground)', pointerEvents:'none', display:'flex' }}>{leftIcon}</div>
        <input className={cx('input', className)} style={{ paddingLeft:32 }} {...rest} />
      </div>
    );
  }
  return <input className={cx('input', className)} {...rest} />;
};

// Textarea
const Textarea = ({ className, ...rest }) => <textarea className={cx('textarea', className)} {...rest} />;

// Popover — anchored floating panel
const Popover = ({ open, onClose, anchorRef, children, align='start', offset=4, minWidth }) => {
  const [pos, setPos] = useState({ top:0, left:0, width:0 });
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const r = anchorRef.current.getBoundingClientRect();
      const left = align === 'end' ? r.right : r.left;
      setPos({ top: r.bottom + offset, left, width: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, align, offset]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (anchorRef.current && anchorRef.current.contains(e.target)) return;
      const pop = document.getElementById('__pop_panel_active');
      if (pop && pop.contains(e.target)) return;
      onClose && onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div id="__pop_panel_active" style={{
      position:'fixed', top:pos.top, left:pos.left,
      transform: align === 'end' ? 'translateX(-100%)' : 'none',
      minWidth: minWidth || pos.width,
      background:'#fff', border:'1px solid var(--border)', borderRadius:8,
      boxShadow:'var(--shadow-pop)', zIndex:60,
      padding:4, animation:'popIn .12s ease-out',
    }}>{children}</div>,
    document.body
  );
};

// DropdownMenu — popover with items
const DropdownMenu = ({ trigger, items, align='start', minWidth=180 }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  return (
    <>
      <span ref={anchorRef} onClick={() => setOpen(o => !o)} style={{ display:'inline-flex' }}>
        {trigger}
      </span>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} align={align} minWidth={minWidth}>
        {items.map((it, i) => it === '---' ? (
          <div key={i} style={{ height:1, background:'var(--border)', margin:'4px 0' }} />
        ) : (
          <button key={i}
            onClick={() => { it.onSelect && it.onSelect(); setOpen(false); }}
            disabled={it.disabled}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:8,
              padding:'7px 10px', background:'transparent', border:0, cursor: it.disabled ? 'not-allowed' : 'pointer',
              borderRadius:5, fontSize:13, color: it.tone === 'destructive' ? '#b91c1c' : 'var(--foreground)',
              opacity: it.disabled ? 0.5 : 1, textAlign:'left',
              fontFamily:'inherit',
            }}
            onMouseEnter={e => { if (!it.disabled) e.currentTarget.style.background = 'var(--muted)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {it.icon && <span style={{ color: it.tone === 'destructive' ? '#b91c1c' : 'var(--muted-foreground)', display:'inline-flex' }}>{it.icon}</span>}
            <span style={{ flex:1 }}>{it.label}</span>
            {it.kbd && <UI.Kbd>{it.kbd}</UI.Kbd>}
          </button>
        ))}
      </Popover>
    </>
  );
};

// Select — custom (replaces native)
const Select = ({ value, onChange, options, placeholder, className, width, size='md' }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const current = options.find(o => o.value === value);
  const h = size === 'sm' ? 28 : 34;
  return (
    <>
      <button
        ref={anchorRef}
        onClick={() => setOpen(o => !o)}
        className={cx(className)}
        style={{
          display:'inline-flex', alignItems:'center', justifyContent:'space-between', gap:8,
          height:h, padding:'0 10px 0 12px',
          background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)',
          fontFamily:'inherit', fontSize:13, color: current ? 'var(--foreground)' : 'var(--muted-foreground)',
          cursor:'pointer', width: width || 'auto', boxShadow:'var(--shadow-xs)',
          transition:'border-color .12s, box-shadow .12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {current ? current.label : (placeholder || '请选择')}
        </span>
        <Icons.ChevD size={13} style={{ color:'var(--muted-foreground)', flexShrink:0 }} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} minWidth={width || 140}>
        {options.map(o => {
          const active = o.value === value;
          return (
            <button key={o.value}
              onClick={() => { onChange && onChange(o.value); setOpen(false); }}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:8,
                padding:'7px 10px', background: active ? 'var(--muted)' : 'transparent',
                border:0, cursor:'pointer', borderRadius:5,
                fontSize:13, color:'var(--foreground)', textAlign:'left', fontFamily:'inherit',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--muted-2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ flex:1 }}>{o.label}</span>
              {active && <Icons.Check size={13} style={{ color:'var(--brand-emphasis)' }} />}
            </button>
          );
        })}
      </Popover>
    </>
  );
};

// Switch
const Switch = ({ checked, onChange }) => (
  <span className={cx('switch', checked && 'on')} onClick={() => onChange && onChange(!checked)} role="switch" aria-checked={checked} />
);

// Tabs
const Tabs = ({ value, onChange, items, size='md' }) => (
  <div style={{
    display:'inline-flex', gap:2, padding:3,
    background:'var(--muted)', borderRadius:8,
  }}>
    {items.map(it => {
      const active = it.value === value;
      return (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className="btn-ghost"
          style={{
            border:0, background: active ? '#fff' : 'transparent',
            color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
            height: size === 'sm' ? 26 : 30,
            padding: size === 'sm' ? '0 10px' : '0 14px',
            borderRadius:6, fontSize: size === 'sm' ? 12 : 13, fontWeight:500,
            display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer',
            boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            transition:'background .12s, color .12s',
          }}
        >
          {it.icon}{it.label}
        </button>
      );
    })}
  </div>
);

// Progress
const Progress = ({ value=0, height=6 }) => (
  <div style={{ width:'100%', height, background:'var(--muted)', borderRadius:999, overflow:'hidden' }}>
    <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height:'100%', background:'var(--foreground)', borderRadius:999, transition:'width .3s' }} />
  </div>
);

// Modal (simple) — portal-rendered so it always escapes ancestor stacking contexts
const Modal = ({ open, onClose, title, description, footer, children, width=520 }) => {
  if (!open) return null;
  if (typeof document === 'undefined') return null;
  const node = (
    <div style={{
      position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.4)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
      animation:'fadeIn .15s ease-out',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width, maxWidth:'100%', maxHeight:'90vh', overflow:'auto',
        background:'#fff', border:'1px solid var(--border)', borderRadius:8,
        boxShadow:'0 10px 38px -10px rgba(0,0,0,.25)',
      }}>
        <div style={{ padding:'20px 24px 12px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:'var(--foreground)' }}>{title}</div>
              {description && <div style={{ fontSize:13, color:'var(--muted-foreground)', marginTop:4 }}>{description}</div>}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}><Icons.Close size={14}/></Button>
          </div>
        </div>
        <div style={{ padding:'4px 24px 20px' }}>{children}</div>
        {footer && (
          <div style={{ padding:'12px 24px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
  return createPortal(node, document.body);
};

// Tooltip (CSS-only on hover via title attr fallback). For real tooltips we use a span.
const Tooltip = ({ children }) => children;

// Section title
const SectionTitle = ({ title, subtitle, action }) => (
  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
    <div>
      <div style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.01em', color:'var(--foreground)' }}>{title}</div>
      {subtitle && <div style={{ fontSize:13, color:'var(--muted-foreground)', marginTop:4 }}>{subtitle}</div>}
    </div>
    {action}
  </div>
);

// Stat card
const StatCard = ({ label, value, sub, trend, icon }) => (
  <Card style={{ padding:16 }}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
      <div style={{ fontSize:12, color:'var(--muted-foreground)' }}>{label}</div>
      {icon && <div style={{ color:'var(--muted-foreground)' }}>{icon}</div>}
    </div>
    <div style={{ fontSize:28, fontWeight:600, letterSpacing:'-0.02em', marginTop:6, color:'var(--foreground)' }}>{value}</div>
    {(sub || trend) && (
      <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
        {trend && (
          <span style={{
            display:'inline-flex', alignItems:'center', gap:3,
            color: trend.direction === 'down' ? 'var(--success)' : trend.direction === 'up-bad' ? 'var(--destructive)' : 'var(--foreground)',
            fontWeight:500,
          }}>
            <Icons.Trend size={12} style={{ transform: trend.direction === 'up' || trend.direction === 'up-bad' ? 'scaleY(-1)' : 'none' }} />
            {trend.label}
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    )}
  </Card>
);

// Keyboard shortcut hint
const Kbd = ({ children }) => (
  <span className="mono" style={{
    fontSize:11, padding:'1px 5px', borderRadius:4, border:'1px solid var(--border)',
    background:'var(--muted-2)', color:'var(--muted-foreground)', lineHeight:1.4,
  }}>{children}</span>
);

const UI = {
  cx, Card, Button, Badge, Dot, Avatar, Input, Textarea, Select, Switch,
  Tabs, Progress, Modal, Tooltip, SectionTitle, StatCard, Kbd, tonePalette,
  Popover, DropdownMenu,
};

/* Lightweight inline SVG charts — area, bar, donut. Minimalist Dribbble style. */

// Area chart with two series
function AreaChart({ data, height=160, accent='#0a0a0a' }) {
  if (!data || data.length === 0) return null;
  const W = 600, H = height;
  const padL = 28, padR = 8, padT = 8, padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxY = Math.max(...data.flatMap(d => [d.newEvents, d.closedEvents])) * 1.15;
  const minY = 0;
  const x = i => padL + (i / (data.length - 1)) * innerW;
  const y = v => padT + innerH - ((v - minY) / (maxY - minY)) * innerH;
  const lineA = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.newEvents)}`).join(' ');
  const areaA = `${lineA} L ${x(data.length-1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  const lineB = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.closedEvents)}`).join(' ');

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => Math.round((maxY / ticks) * i));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display:'block' }}>
      <defs>
        <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* horizontal grid + Y labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#f4f4f5" strokeWidth="1" />
          <text x={padL - 6} y={y(t) + 3} fontSize="10" fill="#a1a1aa" textAnchor="end" fontFamily="JetBrains Mono, monospace">{t}</text>
        </g>
      ))}
      <path d={areaA} fill="url(#areaFill)" />
      <path d={lineA} fill="none" stroke={accent} strokeWidth="1.75" />
      <path d={lineB} fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H - 6} fontSize="10" fill="#a1a1aa" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{d.date}</text>
      ))}
      {/* dots */}
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.newEvents)} r="2.5" fill="#fff" stroke={accent} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// Horizontal bar list — labels left, bar right
function HorizontalBars({ data, accent='#0a0a0a', barHeight=10, rowGap=12 }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:rowGap }}>
      {data.map((d, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 36px', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>{d.name}</span>
          <div style={{ position:'relative', height:barHeight, background:'var(--muted)', borderRadius:3 }}>
            <div style={{ width: `${(d.value/max)*100}%`, height:'100%', background: accent, borderRadius:3, transition:'width .3s' }} />
          </div>
          <span className="mono" style={{ fontSize:12, color:'var(--foreground)', textAlign:'right', fontWeight:500 }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// Donut
function Donut({ data, size=120, thickness=14, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (d.value / total) * circumference;
          const el = (
            <circle key={i}
              cx={cx} cy={cy} r={radius} fill="none"
              stroke={d.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
          {centerValue && <div style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.02em' }}>{centerValue}</div>}
          {centerLabel && <div style={{ fontSize:11, color:'var(--muted-foreground)' }}>{centerLabel}</div>}
        </div>
      )}
    </div>
  );
}

// Sparkline
function Sparkline({ data, width=80, height=24, color='#0a0a0a' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const x = i => (i / (data.length - 1)) * width;
  const y = v => height - ((v - min) / range) * height;
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d)}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

const Charts = { AreaChart, HorizontalBars, Donut, Sparkline };

/* All mock data preserved from v1 prototype. */

const SCENE_CONFIG = {
  phishing:        { label: '钓鱼攻击', iconKey: 'Fish' },
  endpoint:        { label: '终端威胁', iconKey: 'Monitor' },
  network:         { label: '网络攻击', iconKey: 'Globe' },
  cloud:           { label: '云安全',   iconKey: 'Cloud' },
  identity:        { label: '身份安全', iconKey: 'Key' },
  insider_threat:  { label: '内部威胁', iconKey: 'Alert' },
};

const PRIORITY_CONFIG = {
  critical: { label: '紧急', tone: 'critical' },
  high:     { label: '高',   tone: 'high' },
  medium:   { label: '中',   tone: 'medium' },
  low:      { label: '低',   tone: 'low' },
};

const INVESTIGATION_STATUS_CONFIG = {
  investigating: { label: '调查中',  iconKey: 'Loader' },
  completed:     { label: '已完成',  iconKey: 'Check'  },
  pending_human: { label: '待人工',  iconKey: 'User'   },
  closed:        { label: '已关闭',  iconKey: 'Lock'   },
};

const PROCESS_STATUS_CONFIG = {
  pending:    { label: '待处理' },
  processing: { label: '处理中' },
  closed:     { label: '已关闭' },
};

const mockEvents = [
  { id: 'EVT-2024031500001', alertId: 'ALT-2024031500123',
    title: 'zhang.san@company.com · 点击恶意链接并提交凭据表单',
    sceneCategory: 'phishing', priority: 'critical', severity: 'critical', sourceSystem: 'Proofpoint TAP', triggeredAt: '2024-03-15T01:23:11Z',
    entities: [{ type:'account', value:'zhang.san@company.com'}, {type:'ip', value:'185.220.101.34'}, {type:'domain', value:'micros0ft-support.com'}, {type:'url', value:'http://micros0ft-support.com/login?ref=urgent'}],
    investigationStatus: 'completed', processStatus: 'pending', assignee: { id:'u1', name:'李明' }, slaDeadline: '2024-03-15T02:23:11Z' },

  { id: 'EVT-2024031500002', alertId: 'ALT-2024031500124',
    title: 'li.si@company.com · 5分钟内登录失败87次，来源已知恶意IP',
    sceneCategory: 'identity', priority: 'high', severity: 'high', sourceSystem: 'AD/LDAP', triggeredAt: '2024-03-15T02:15:33Z',
    entities: [{type:'account', value:'li.si@company.com'}, {type:'ip', value:'203.0.113.45'}],
    investigationStatus: 'investigating', processStatus: 'pending', assignee: { id:'u2', name:'王芳' }, slaDeadline: '2024-03-15T04:15:33Z' },

  { id: 'EVT-2024031500003', alertId: 'ALT-2024031500125',
    title: 'wang.wu@company.com · 从俄罗斯Tor节点登录，2小时内Impossible Travel',
    sceneCategory: 'identity', priority: 'critical', severity: 'critical', sourceSystem: 'VPN Gateway', triggeredAt: '2024-03-15T03:45:22Z',
    entities: [{type:'account', value:'wang.wu@company.com'}, {type:'ip', value:'185.220.103.7'}, {type:'device', value:'MacBook-WANG'}],
    investigationStatus: 'pending_human', processStatus: 'processing', assignee: { id:'u1', name:'李明' }, slaDeadline: '2024-03-15T04:45:22Z' },

  { id: 'EVT-2024031500004', alertId: 'ALT-2024031500126',
    title: 'DESKTOP-A1B2C3(zhao.liu) · EDR检测到可疑进程注入行为',
    sceneCategory: 'endpoint', priority: 'high', severity: 'high', sourceSystem: 'CrowdStrike', triggeredAt: '2024-03-15T04:12:08Z',
    entities: [{type:'device', value:'DESKTOP-A1B2C3'}, {type:'account', value:'zhao.liu@company.com'}, {type:'file', value:'svchost_inject.exe'}],
    investigationStatus: 'investigating', processStatus: 'pending', slaDeadline: '2024-03-15T06:12:08Z' },

  { id: 'EVT-2024031500005', alertId: 'ALT-2024031500127',
    title: '10.100.5.23 · 检测到与已知C2服务器通信',
    sceneCategory: 'network', priority: 'critical', severity: 'critical', sourceSystem: 'Palo Alto Firewall', triggeredAt: '2024-03-15T05:33:41Z',
    entities: [{type:'ip', value:'10.100.5.23'}, {type:'ip', value:'91.219.236.166'}, {type:'domain', value:'update-service.xyz'}],
    investigationStatus: 'completed', processStatus: 'processing', assignee: { id:'u3', name:'陈强' }, slaDeadline: '2024-03-15T06:33:41Z' },

  { id: 'EVT-2024031500006', alertId: 'ALT-2024031500128',
    title: 'admin-svc · 非工作时间大量API调用，涉及IAM权限变更',
    sceneCategory: 'cloud', priority: 'medium', severity: 'medium', sourceSystem: '阿里云SLS', triggeredAt: '2024-03-15T06:22:15Z',
    entities: [{type:'account', value:'admin-svc'}, {type:'ip', value:'203.0.113.100'}],
    investigationStatus: 'investigating', processStatus: 'pending', slaDeadline: '2024-03-15T10:22:15Z' },

  { id: 'EVT-2024031500007', alertId: 'ALT-2024031500129',
    title: 'chen.qi@company.com · 非工作时间下载287MB财务敏感文件',
    sceneCategory: 'insider_threat', priority: 'high', severity: 'high', sourceSystem: 'DLP System', triggeredAt: '2024-03-15T07:45:33Z',
    entities: [{type:'account', value:'chen.qi@company.com'}, {type:'file', value:'Q1_Payment_Records.xlsx'}, {type:'device', value:'LAPTOP-CHEN'}],
    investigationStatus: 'pending_human', processStatus: 'pending', assignee: { id:'u2', name:'王芳' }, slaDeadline: '2024-03-15T09:45:33Z' },

  { id: 'EVT-2024031500008', alertId: 'ALT-2024031500130',
    title: '10.100.2.15 · 检测到内网横向扫描行为，涉及445/3389端口',
    sceneCategory: 'network', priority: 'medium', severity: 'medium', sourceSystem: '深信服IPS', triggeredAt: '2024-03-15T08:11:27Z',
    entities: [{type:'ip', value:'10.100.2.15'}, {type:'device', value:'SRV-DEV-01'}],
    investigationStatus: 'completed', processStatus: 'closed', assignee: { id:'u1', name:'李明' } },

  { id: 'EVT-2024031500009', alertId: 'ALT-2024031500131',
    title: 'liu.ba@company.com · 收到伪装为CEO的紧急转账请求邮件',
    sceneCategory: 'phishing', priority: 'high', severity: 'high', sourceSystem: 'Microsoft Defender', triggeredAt: '2024-03-15T09:05:44Z',
    entities: [{type:'account', value:'liu.ba@company.com'}, {type:'domain', value:'ceo-company.net'}],
    investigationStatus: 'completed', processStatus: 'closed' },

  { id: 'EVT-2024031500010', alertId: 'ALT-2024031500132',
    title: 'sun.jiu@company.com · 30分钟内收到23次MFA推送请求',
    sceneCategory: 'identity', priority: 'high', severity: 'high', sourceSystem: 'MFA System', triggeredAt: '2024-03-15T10:30:18Z',
    entities: [{type:'account', value:'sun.jiu@company.com'}, {type:'ip', value:'192.168.1.105'}],
    investigationStatus: 'investigating', processStatus: 'pending', assignee: { id:'u3', name:'陈强' }, slaDeadline: '2024-03-15T12:30:18Z' },
];

const mockReport = {
  eventId: 'EVT-2024031500001',
  summary: { conclusion: 'threat', confidenceNote: '基于多维度证据链分析', oneLiner: '确认为真实钓鱼攻击，用户凭据已泄露，需立即响应' },
  topFindings: [
    { id:'f1', finding:'用户点击了伪装成 Microsoft 登录页面的钓鱼链接，并提交了企业凭据', evidenceRef:'e1' },
    { id:'f2', finding:'钓鱼域名 micros0ft-support.com 注册于事件发生前 48 小时，使用 Cloudflare 隐藏真实 IP', evidenceRef:'e2' },
    { id:'f3', finding:'凭据提交后 15 分钟，检测到来自荷兰 IP 的成功登录，确认为 Impossible Travel', evidenceRef:'e3' },
    { id:'f4', finding:'攻击者已创建邮件转发规则，将所有财务相关邮件转发至外部邮箱', evidenceRef:'e4' },
  ],
  evidenceLocker: [
    { id:'e1', type:'log', source:'Proofpoint TAP', timestamp:'2024-03-15T01:23:11Z',
      content:`URL Click Event:
user: zhang.san@company.com
clicked_url: http://micros0ft-support.com/login?ref=urgent
user_agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
src_ip: 10.100.5.88
form_submitted: true
form_fields: ["username", "password"]`,
      interpretation:'用户不仅点击了链接，还在钓鱼页面上提交了表单，极大概率泄露了凭据', relevance:'critical' },
    { id:'e2', type:'intel', source:'Threat Intelligence', timestamp:'2024-03-15T01:24:00Z',
      content:`Domain Analysis:
domain: micros0ft-support.com
registrar: Namecheap
registration_date: 2024-03-13
dns_provider: Cloudflare
ssl_cert: Let's Encrypt (issued 2024-03-13)
whois_privacy: enabled
similar_domains_detected: 47`,
      interpretation:'典型的钓鱼域名特征：新注册、启用隐私保护、使用免费 SSL 证书', relevance:'high' },
    { id:'e3', type:'log', source:'Azure AD', timestamp:'2024-03-15T01:38:22Z',
      content:`Sign-in Event:
user: zhang.san@company.com
result: Success
ip: 185.220.101.34
location: Amsterdam, Netherlands
device: Unknown
mfa_result: not_required (trusted_location_bypass)
previous_login: 2024-03-15T01:15:00Z from Beijing, China`,
      interpretation:'Impossible Travel 确认：用户 15 分钟前在北京登录，现在从荷兰登录成功', relevance:'critical' },
    { id:'e4', type:'log', source:'Exchange Online', timestamp:'2024-03-15T01:42:15Z',
      content:`Inbox Rule Created:
user: zhang.san@company.com
rule_name: "."
conditions: subject contains "invoice" OR "payment" OR "财务" OR "转账"
action: forward to external-collector@protonmail.com
action: mark as read
action: move to deleted items`,
      interpretation:'攻击者创建了隐蔽的邮件转发规则，规则名仅为一个点号以逃避检测', relevance:'critical' },
  ],
  reasoningChain: [
    { id:'s1', timestamp:'2024-03-15T01:23:30Z', phase:'phase1', action:'reason', reasoning:'收到钓鱼邮件点击告警，首先需要验证：1) 域名是否真的是钓鱼域名 2) 用户是否只是点击还是提交了凭据' },
    { id:'s2', timestamp:'2024-03-15T01:23:35Z', phase:'phase1', action:'act', tool:'query_threat_intel', input:{indicator:'micros0ft-support.com', type:'domain'}, reasoning:'查询域名威胁情报，确认是否为已知恶意域名' },
    { id:'s3', timestamp:'2024-03-15T01:23:40Z', phase:'phase1', action:'observe', output:{verdict:'malicious', confidence:0.95, reason:'typosquatting + new_registration'}, reasoning:'威胁情报确认：该域名为典型的品牌仿冒钓鱼域名，注册时间仅 2 天', findings:['钓鱼域名确认为恶意'] },
    { id:'s4', timestamp:'2024-03-15T01:24:00Z', phase:'phase1', action:'act', tool:'query_email_clicks', input:{email:'zhang.san@company.com', time_range:'1h'}, reasoning:'查询用户点击详情，确认是否提交了表单' },
    { id:'s5', timestamp:'2024-03-15T01:24:10Z', phase:'phase1', action:'observe', output:{form_submitted:true, fields:['username','password']}, reasoning:'确认用户不仅点击了链接，还提交了包含用户名和密码的表单，凭据已泄露', findings:['用户凭据已通过钓鱼表单泄露'] },
    { id:'s6', timestamp:'2024-03-15T01:25:00Z', phase:'phase2', action:'reason', reasoning:'凭据泄露确认，需要调查：1) 是否已有异常登录 2) 攻击者是否已执行恶意操作' },
    { id:'s7', timestamp:'2024-03-15T01:25:10Z', phase:'phase2', action:'act', tool:'query_ad_login_history', input:{account:'zhang.san@company.com', days:1}, reasoning:'查询账号近期登录记录，寻找异常登录' },
    { id:'s8', timestamp:'2024-03-15T01:25:20Z', phase:'phase2', action:'observe', output:{anomalous_login:{ip:'185.220.101.34', location:'Netherlands', time:'2024-03-15T01:38:22Z'}}, reasoning:'发现来自荷兰的异常登录，与北京登录间隔仅 15 分钟，确认为 Impossible Travel', findings:['攻击者已使用窃取的凭据登录账号'] },
  ],
  impactAssessment: {
    affectedAccounts: ['zhang.san@company.com'],
    affectedDevices: ['DESKTOP-ZHANG'],
    affectedSystems: ['Azure AD', 'Exchange Online', 'SharePoint'],
    attackStage: '已完成初始访问，正在进行持久化和数据收集',
  },
  remediationActions: [
    { id:'r1', level:'immediate', title:'强制下线所有会话', description:'立即撤销 zhang.san 账号的所有活动会话和刷新令牌', status:'pending' },
    { id:'r2', level:'immediate', title:'删除恶意邮件转发规则', description:'删除攻击者创建的邮件转发规则，防止继续数据泄露', status:'pending' },
    { id:'r3', level:'immediate', title:'封锁攻击者 IP', description:'将 185.220.101.34 加入防火墙黑名单', status:'pending' },
    { id:'r4', level:'short_term', title:'重置账号密码并启用 MFA', description:'强制重置密码，并确保 MFA 已启用且无绕过条件', status:'pending' },
    { id:'r5', level:'short_term', title:'审计账号访问记录', description:'检查 zhang.san 账号在被控期间访问的所有文件和系统', status:'pending' },
    { id:'r6', level:'long_term', title:'调整 MFA 策略', description:'移除 trusted_location_bypass 策略，所有登录均要求 MFA', status:'pending' },
  ],
  generatedAt: '2024-03-15T01:30:00Z',
};

const mockKnowledgeEntries = [
  { id:'k1', type:'entity_graph', title:'账号 zhang.san 实体信息', content:'姓名：张三，部门：财务部，职级：财务主管，高价值账号。负责公司财务审批，有权访问核心财务系统。', source:'manual', createdAt:'2024-01-15T08:00:00Z', updatedAt:'2024-03-01T10:00:00Z', referenceCount:23, lastUsedAt:'2024-03-15T01:23:35Z', tags:['财务部','高价值账号','VIP'] },
  { id:'k2', type:'behavior_baseline', title:'用户 zhang.san 行为基线', content:'历史登录地点：仅中国境内（北京、上海）。工作时间：工作日 8:30-20:00。常用设备：DESKTOP-ZHANG, iPhone-Zhang。从未有境外登录记录。', source:'auto', createdAt:'2024-02-01T00:00:00Z', updatedAt:'2024-03-14T23:59:00Z', referenceCount:15, lastUsedAt:'2024-03-15T01:25:00Z', tags:['行为基线','登录模式'] },
  { id:'k3', type:'policy_context', title:'境外登录审批策略', content:'根据公司安全策略，任何境外 VPN 或直接登录必须提前 48 小时在 OA 系统提交出差申请并获得审批。未经审批的境外登录一律视为高风险事件。', source:'manual', createdAt:'2024-01-01T00:00:00Z', updatedAt:'2024-01-01T00:00:00Z', referenceCount:89, tags:['安全策略','境外登录'] },
  { id:'k4', type:'investigation_history', title:'IP 185.220.101.34 历史记录', content:'该 IP 属于 Tor 出口节点，曾于 2024 年 2 月多次尝试攻击本公司 VPN 网关。已被列入永久黑名单。', source:'feedback', createdAt:'2024-02-15T14:30:00Z', updatedAt:'2024-02-15T14:30:00Z', referenceCount:5, lastUsedAt:'2024-03-15T01:38:00Z', tags:['恶意IP','Tor','黑名单'] },
  { id:'k5', type:'entity_graph', title:'IP 段 10.100.0.0/16 归属', content:'研发测试内网段，主要用于开发和测试环境。该网段的流量属于正常内部流量，非外部攻击。', source:'manual', createdAt:'2024-01-10T00:00:00Z', updatedAt:'2024-01-10T00:00:00Z', referenceCount:156, tags:['内网','研发','白名单'] },
  { id:'k6', type:'behavior_baseline', title:'财务系统月结操作基线', content:'每月 25-28 日为财务月结期，财务部人员会在此期间执行大量数据导出操作，单次导出量可达 500MB，属于正常业务操作。', source:'feedback', createdAt:'2024-02-28T10:00:00Z', updatedAt:'2024-02-28T10:00:00Z', referenceCount:12, tags:['财务','月结','基线'] },
];

const mockHuntTasks = [
  { id:'hunt-001', name:'分布式爆破检测', mode:'auto', hypothesis:'短时间内多账号登录失败，是否存在低速分布式爆破', status:'completed', triggeredBy:'系统定时任务', startedAt:'2024-03-15T00:00:00Z', completedAt:'2024-03-15T00:15:00Z',
    findings:[{ id:'hf1', severity:'medium', description:'检测到来自 IP 203.0.113.0/24 网段的分布式登录尝试，涉及 47 个账号，单账号失败次数均未触发锁定阈值', evidence:'统计时间窗口：2024-03-14 22:00 - 2024-03-15 00:00\n总失败次数：1,247 次\n涉及账号：47 个\n来源 IP 段：203.0.113.0/24' }] },
  { id:'hunt-002', name:'境外登录后敏感系统访问', mode:'auto', hypothesis:'有没有用户在境外成功登录后立即访问高敏感系统', status:'completed', triggeredBy:'系统定时任务', startedAt:'2024-03-15T01:00:00Z', completedAt:'2024-03-15T01:20:00Z', findings:[] },
  { id:'hunt-003', name:'非标准路径进程启动检测', mode:'auto', hypothesis:'有没有进程从非标准路径启动', status:'running', triggeredBy:'系统定时任务', startedAt:'2024-03-15T08:00:00Z', findings:[] },
  { id:'hunt-004', name:'供应商 VPN 账号横向移动调查', mode:'manual', hypothesis:'我怀疑有攻击者通过供应商 VPN 账号在内网横向移动', query:'查供应商账号列表 → 查这些账号的 VPN 登录记录 → 查登录后的内网访问行为', status:'completed', triggeredBy:'李明', startedAt:'2024-03-14T15:30:00Z', completedAt:'2024-03-14T16:00:00Z',
    findings:[{ id:'hf2', severity:'low', description:'供应商账号访问行为均在授权范围内，未发现异常横向移动', evidence:'检查账号数：12 个\n异常行为：0' }] },
];

const huntPacks = [
  { id:'hp1', name:'分布式爆破检测', description:'检测短时间内多账号登录失败，识别低速分布式爆破攻击', scene:'identity', frequency:'每日' },
  { id:'hp2', name:'境外登录后敏感访问', description:'检测境外成功登录后立即访问高敏感系统的行为', scene:'identity', frequency:'每日' },
  { id:'hp3', name:'非标准路径进程启动', description:'检测从非标准路径（System32/Program Files 以外）启动的进程', scene:'endpoint', frequency:'每 6 小时' },
  { id:'hp4', name:'DGA 域名检测', description:'检测大量 DNS 查询指向新注册域名，识别疑似 DGA 行为', scene:'network', frequency:'每日' },
  { id:'hp5', name:'非维护窗口敏感操作', description:'检测服务账号在非维护窗口执行的敏感操作', scene:'insider_threat', frequency:'每日' },
  { id:'hp6', name:'数据窃取预操作检测', description:'检测大量数据下载后账号注销的行为模式', scene:'insider_threat', frequency:'每日' },
];

const mockAlertSources = [
  { id:'src-1', name:'Proofpoint TAP', type:'webhook', status:'active', lastSeen:'2024-03-15T10:30:00Z', alertCount:1245, category:'alert' },
  { id:'src-2', name:'CrowdStrike Falcon', type:'api', status:'active', lastSeen:'2024-03-15T10:29:55Z', alertCount:3421, category:'alert' },
  { id:'src-3', name:'Palo Alto Firewall', type:'syslog', status:'active', lastSeen:'2024-03-15T10:30:01Z', alertCount:8932, category:'alert' },
  { id:'src-4', name:'Azure AD', type:'api', status:'active', lastSeen:'2024-03-15T10:28:00Z', alertCount:2156, category:'alert' },
  { id:'src-5', name:'阿里云 SLS', type:'kafka', status:'active', lastSeen:'2024-03-15T10:30:00Z', alertCount:1567, category:'alert' },
  { id:'src-6', name:'DLP System', type:'webhook', status:'error', lastSeen:'2024-03-15T08:15:00Z', alertCount:432, category:'alert' },
  { id:'src-7', name:'深信服 EDR', type:'syslog', status:'active', lastSeen:'2024-03-15T10:29:58Z', alertCount:2891, category:'alert' },
  { id:'src-8', name:'Microsoft Defender', type:'api', status:'inactive', lastSeen:'2024-03-14T23:00:00Z', alertCount:987, category:'alert' },
];

const mockLogSources = [
  { id:'log-1', name:'Elasticsearch · 安全事件日志', type:'api', status:'active', lastSeen:'2024-03-15T10:30:00Z', logCount:4521390, category:'log' },
  { id:'log-2', name:'ClickHouse · 网络流量日志', type:'kafka', status:'active', lastSeen:'2024-03-15T10:30:01Z', logCount:18923421, category:'log' },
  { id:'log-3', name:'Splunk · Windows 事件日志', type:'api', status:'active', lastSeen:'2024-03-15T10:29:48Z', logCount:6234120, category:'log' },
  { id:'log-4', name:'Graylog · 应用访问日志', type:'syslog', status:'active', lastSeen:'2024-03-15T10:29:55Z', logCount:2341823, category:'log' },
  { id:'log-5', name:'MinIO · 合规归档日志', type:'api', status:'active', lastSeen:'2024-03-15T10:28:00Z', logCount:98234012, category:'log' },
  { id:'log-6', name:'Loki · 容器运行时日志', type:'api', status:'error', lastSeen:'2024-03-15T07:42:00Z', logCount:1234567, category:'log' },
];

const mockDashboardStats = {
  totalAlerts: 21631,
  totalEvents: 847,
  alertReductionRate: 96.1,
  eventsByPriority: { critical:3, high:5, medium:12, low:27 },
  eventsByScene: { phishing:156, endpoint:203, network:178, cloud:89, identity:142, insider_threat:79 },
  aiInvestigationAvgTime: 3.2,
  aiAccuracyRate: 94.5,
  slaComplianceRate: 97.8,
  todayNew: 47,
  todayClosed: 38,
  trendData: [
    { date:'03-09', newEvents:42, closedEvents:38 },
    { date:'03-10', newEvents:35, closedEvents:41 },
    { date:'03-11', newEvents:51, closedEvents:45 },
    { date:'03-12', newEvents:38, closedEvents:42 },
    { date:'03-13', newEvents:44, closedEvents:39 },
    { date:'03-14', newEvents:56, closedEvents:48 },
    { date:'03-15', newEvents:47, closedEvents:38 },
  ],
};


/* App shell: sidebar + topbar + content frame — v2 with brand logo & prominent active state */

const { useState: useStateShell, useEffect: useEffectShell } = React;

const NAV_ITEMS = [
  { key:'dashboard', label:'调查看板', iconKey:'Dashboard' },
  { key:'events',    label:'事件中心', iconKey:'Alert' },
  { key:'hunting',   label:'主动狩猎', iconKey:'Target' },
  { key:'atomic-capabilities', label:'能力地图', iconKey:'Network' },
  { key:'knowledge', label:'环境上下文', iconKey:'Database' },
  { key:'settings',  label:'设置',     iconKey:'Settings' },
];

/* Brand logo: SVG icon + "Sec"(dark)/"mind"(green) wordmark */
function BrandLogo({ collapsed }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, overflow:'hidden' }}>
      {/* Icon */}
      <svg width="24" height="25" viewBox="0 0 30.355 32" fill="none" style={{ flexShrink:0 }}>
        <path fillRule="evenodd" fill="#22c55e"
          d="M2.773,11.967C9.437,11.967,15.413,8.101,18.204,2.202C18.71,1.133,17.863,0,16.681,0L4.67,0C2.091,0,0,2.091,0,4.67L0,10.253C0,11.111,0.61,11.851,1.465,11.916C1.9,11.95,2.336,11.967,2.773,11.967ZM19.264,11.237C19.264,7.368,20.578,3.621,22.977,0.606C23.292,0.21,23.772,0,24.278,0L25.685,0C28.264,0,30.355,2.091,30.355,4.67L30.355,18.035C30.355,19.373,29.781,20.646,28.779,21.533L26.62,23.443C25.976,24.013,25.009,24.04,24.395,23.439C21.128,20.242,19.264,15.849,19.264,11.237ZM5.691,14.593C13.092,14.593,19.605,19.353,21.901,26.303C22.109,26.93,21.897,27.62,21.403,28.057L18.271,30.828C16.505,32.39,13.85,32.39,12.083,30.828L1.576,21.533C0.574,20.646,0,19.373,0,18.035L0,16.808C0,16.066,0.469,15.395,1.185,15.199C2.651,14.797,4.167,14.593,5.691,14.593Z"
        />
      </svg>
      {!collapsed && (
        <span style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1, whiteSpace:'nowrap' }}>
          <span style={{ color:'#030914' }}>Sec</span><span style={{ color:'#22c55e' }}>mind</span>
        </span>
      )}
    </div>
  );
}

function Sidebar({ current, onNavigate, collapsed, onToggle }) {
  return (
    <aside style={{
      width: collapsed ? 56 : 220,
      flexShrink:0, height:'100vh',
      borderRight:'1px solid var(--border)',
      background:'#fff',
      display:'flex', flexDirection:'column',
      transition:'width .2s',
    }}>
      {/* Logo / brand */}
      <div style={{
        height:56, padding: collapsed ? '0' : '0 16px',
        display:'flex', alignItems:'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap:10, borderBottom:'1px solid var(--border)',
      }}>
        <BrandLogo collapsed={collapsed} />
      </div>

      {/* Workspace switcher */}
      {!collapsed && (
        <div style={{ padding:'10px 12px' }}>
          <button className="btn" style={{
            width:'100%', justifyContent:'space-between',
            height:34, padding:'0 10px', background:'var(--muted-2)',
          }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
              <UI.Avatar name="安" size={18} style={{ borderRadius:4, background:'#dcfce7', color:'#166534', borderColor:'transparent' }}/>
              <span style={{ fontSize:13, fontWeight:500 }}>安全运营组</span>
            </span>
            <Icons.ChevD size={13} style={{ color:'var(--muted-foreground)' }} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding:'0 8px', flex:1, overflowY:'auto' }}>
        {!collapsed && (
          <div style={{ padding:'8px 8px 4px', fontSize:11, color:'var(--muted-foreground)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' }}>工作区</div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {NAV_ITEMS.map(item => {
            const Icon = Icons[item.iconKey];
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  width:'100%', height:34,
                  padding: collapsed ? 0 : '0 10px',
                  paddingLeft: (!collapsed && active) ? 7 : (!collapsed ? 10 : 0),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'var(--brand-soft)' : 'transparent',
                  color: active ? 'var(--brand-emphasis)' : '#52525b',
                  border: 0,
                  borderLeft: (!collapsed && active) ? '3px solid var(--brand)' : (!collapsed ? '3px solid transparent' : '0'),
                  borderRadius: 6,
                  cursor:'pointer',
                  fontSize:13, fontWeight: active ? 600 : 400,
                  transition:'background .12s, color .12s',
                  textAlign:'left', outline:'none',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--muted-2)'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; } }}
              >
                <Icon size={15} style={{ color: active ? 'var(--brand)' : '#71717a', flexShrink:0 }} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {!collapsed && (
          <>
            <div style={{ padding:'16px 8px 4px', fontSize:11, color:'var(--muted-foreground)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' }}>近期事件</div>
            {mockEvents.slice(0,3).map(e => (
              <button key={e.id} onClick={() => onNavigate('events/' + e.id)} style={{
                display:'flex', alignItems:'center', gap:8,
                width:'100%', padding:'6px 10px', height:'auto', minHeight:32,
                background:'transparent', border:0, borderRadius:6, cursor:'pointer', textAlign:'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--muted-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <UI.Dot tone={e.priority} />
                <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {e.id.replace('EVT-2024031500','EVT-…')}
                </span>
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding:8, borderTop:'1px solid var(--border)' }}>
        <button onClick={onToggle} className="btn btn-ghost" style={{ width:'100%', justifyContent: collapsed ? 'center' : 'space-between', height:32 }}>
          {!collapsed && <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>收起菜单</span>}
          {collapsed ? <Icons.ChevR size={14}/> : <Icons.ChevL size={14}/>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ current, breadcrumb, onNavigate }) {
  return (
    <header style={{
      height:56, padding:'0 24px',
      borderBottom:'1px solid var(--border)',
      background:'#fff', display:'flex', alignItems:'center',
      justifyContent:'space-between', gap:16,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
        <span style={{ color:'var(--muted-foreground)' }}>{breadcrumb?.[0] || '工作区'}</span>
        {breadcrumb && breadcrumb.length > 1 && breadcrumb.slice(1).map((b, i) => (
          <React.Fragment key={i}>
            <Icons.ChevR size={12} style={{ color:'var(--muted-foreground)' }}/>
            <span style={{ color: i === breadcrumb.length - 2 ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: i === breadcrumb.length - 2 ? 500 : 400 }}>{b}</span>
          </React.Fragment>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button className="btn" style={{ height:32, padding:'0 10px', background:'var(--muted-2)', minWidth:240, justifyContent:'space-between', color:'var(--muted-foreground)' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
            <Icons.Search size={14}/>
            <span style={{ fontSize:12 }}>搜索事件、实体、知识…</span>
          </span>
          <UI.Kbd>⌘K</UI.Kbd>
        </button>
        <UI.Badge tone="success">
          <UI.Dot tone="success" size={6} pulse /> 引擎在线
        </UI.Badge>
        <UI.Button variant="ghost" size="icon-sm" title="通知"><Icons.Bell size={15}/></UI.Button>
        <div style={{ width:1, height:20, background:'var(--border)', margin:'0 4px' }} />
        <button className="btn btn-ghost" style={{ height:32, padding:'0 6px 0 4px', gap:6 }}>
          <UI.Avatar name="李" size={22} style={{ background:'#fee2e2', color:'#991b1b', borderColor:'transparent' }} />
          <span style={{ fontSize:13, fontWeight:500 }}>李明</span>
          <Icons.ChevD size={12} style={{ color:'var(--muted-foreground)' }}/>
        </button>
      </div>
    </header>
  );
}

function AppShell({ current, breadcrumb, onNavigate, children }) {
  const [collapsed, setCollapsed] = useStateShell(false);
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#fafafa' }}>
      <Sidebar current={current} onNavigate={onNavigate} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Topbar current={current} breadcrumb={breadcrumb} onNavigate={onNavigate} />
        <main style={{ flex:1, overflow:'auto', padding:'24px 32px 48px', background:'#fafafa' }}>
          <div className="fade-in" style={{ maxWidth:1320, margin:'0 auto' }}>{children}</div>
        </main>
      </div>
    </div>
  );
}

const Shell = { AppShell, NAV_ITEMS };

/* Dashboard page — 调查看板 v2: brand logo + updated resource stats */

function DashboardPage({ onNavigate }) {
  const stats = mockDashboardStats;

  // Active event types — derived from mockEvents
  const evtByScene = {};
  mockEvents.forEach(e => { evtByScene[e.sceneCategory] = (evtByScene[e.sceneCategory] || 0) + 1; });
  const maxScene = Math.max(...Object.values(evtByScene), 1);

  const activeTypes = [
    { key:'phishing',      name:'钓鱼攻击',   value: evtByScene['phishing']      || 0, max: maxScene, iconKey:'Fish' },
    { key:'identity',      name:'身份安全',   value: evtByScene['identity']      || 0, max: maxScene, iconKey:'Key' },
    { key:'network',       name:'网络攻击',   value: evtByScene['network']       || 0, max: maxScene, iconKey:'Globe' },
    { key:'endpoint',      name:'终端威胁',   value: evtByScene['endpoint']      || 0, max: maxScene, iconKey:'Monitor' },
    { key:'cloud',         name:'云安全',     value: evtByScene['cloud']         || 0, max: maxScene, iconKey:'Cloud' },
    { key:'insider_threat',name:'内部威胁',   value: evtByScene['insider_threat']|| 0, max: maxScene, iconKey:'Alert' },
  ];

  const trend = generateTrend();
  const totalEvents  = 1880;
  const closedEvents = 794;
  const closeRate    = ((closedEvents / totalEvents) * 100).toFixed(1);

  // Resource stats — based on 1880 historical events
  const saved = { investigate: 4389, handle: 667, escalate: 2290 };
  const totalSaved = saved.investigate + saved.handle + saved.escalate;
  const donut = [
    { value: saved.investigate, color:'#22c55e' },
    { value: saved.handle,      color:'#facc15' },
    { value: saved.escalate,    color:'#3b82f6' },
  ];

  // Combined source health (alert + log)
  const allSources = [...mockAlertSources.slice(0, 3), ...mockLogSources.slice(0, 3)];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Hero */}
      <HeroSection onNavigate={onNavigate} />

      {/* Headline KPIs strip */}
      <UI.Card style={{ padding:'22px 28px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', alignItems:'center' }}>
          <KpiInline iconBg="#fef2f2" iconFg="#dc2626" iconKey="Alert" value="15,435" label="告警数" />
          <KpiInline iconBg="var(--brand-soft)" iconFg="var(--brand-emphasis)" iconKey="Shield" value="1,880" label="事件数" />
          <KpiInline plain value="88%" label="降低告警率" trend="up" />
        </div>
      </UI.Card>

      {/* Active types + trend */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.8fr', gap:16 }}>
        <UI.Card style={{ padding:'20px 22px' }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:18 }}>活跃事件类型</div>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {activeTypes.map(t => {
              const Icon = Icons[t.iconKey];
              const empty = t.value === 0;
              return (
                <div key={t.key}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:13 }}>
                      <Icon size={14} style={{ color:'var(--muted-foreground)' }}/>
                      {t.name}
                    </span>
                    <span className="mono" style={{ fontSize:13, fontWeight:500, color: empty ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                      {empty ? '—' : t.value}
                    </span>
                  </div>
                  <div style={{ height:4, background:'var(--muted)', borderRadius:2, overflow:'hidden' }}>
                    {!empty && <div style={{ width: `${(t.value / t.max) * 100}%`, height:'100%', background:'var(--brand)', borderRadius:2, transition:'width .3s' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </UI.Card>

        <UI.Card style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600 }}>历史事件趋势</div>
            <div style={{ display:'flex', gap:14, fontSize:11.5, color:'var(--muted-foreground)' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:2, background:'#22c55e', display:'inline-block' }}/>事件创建</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:2, background:'#ef4444', display:'inline-block' }}/>事件关闭</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:24, alignItems:'center' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <TrendStat label="总事件数" value={totalEvents.toLocaleString()} />
              <TrendStat label="处置事件数" value={closedEvents.toLocaleString()} />
              <TrendStat label="平均处置率" value={`${closeRate}%`} brand />
            </div>
            <DualLineChart data={trend} height={200} />
          </div>
        </UI.Card>
      </div>

      {/* 资源利用 section */}
      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:4 }}>
        <h3 style={{ fontSize:16, fontWeight:600, margin:0, letterSpacing:'-0.01em' }}>资源利用</h3>
        <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>SecMind 为您节省的运营时间</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2.4fr', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <ResourceCard label="研判平均用时" value="29.00" unit="s" iconKey="Clock" />
          <ResourceCard label="研判准确率" value="95.70" unit="%" iconKey="Target" brand />
        </div>

        <UI.Card style={{ padding:'24px 28px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>总节省时间预估</div>
              <div style={{ fontSize:12, color:'var(--muted-foreground)', lineHeight:1.6, maxWidth:420 }}>
                计算调查中每一个阶段的平均用时时长。SecMind 为您省去不必要的花费，把重心放在更有价值的内容上。
              </div>
              <div style={{ marginTop:24, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:18 }}>
                <BreakdownItem color="#22c55e" label="调查" value={saved.investigate.toLocaleString()} unit="hrs" />
                <BreakdownItem color="#facc15" label="处置" value={saved.handle.toLocaleString()} unit="hrs" />
                <BreakdownItem color="#3b82f6" label="上报" value={saved.escalate.toLocaleString()} unit="hrs" />
              </div>
            </div>
            <div style={{ position:'relative' }}>
              <Charts.Donut data={donut} size={170} thickness={12} centerValue={totalSaved.toLocaleString()} centerLabel="hrs" />
            </div>
          </div>
        </UI.Card>
      </div>

      {/* Engine activity + Source health */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16 }}>
        <UI.Card style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600 }}>调查引擎实时活动</div>
            <UI.Badge variant="muted"><UI.Dot tone="success" size={6} pulse style={{ background:'var(--brand)' }} /> Live</UI.Badge>
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {[
              { time:'10:31:22', tone:'info',    text:'调用 query_threat_intel（185.220.103.7）', mono:true },
              { time:'10:31:18', tone:'neutral',  text:'阶段一完成 · EVT-2024031500003 · 5 步推理 · 2.4s' },
              { time:'10:31:05', tone:'info',    text:'查询 Azure AD sign-in history · zhang.san@company.com', mono:true },
              { time:'10:30:51', tone:'success',  text:'结论生成 · EVT-2024031500001 · 确认威胁（置信度 0.95）' },
              { time:'10:30:33', tone:'neutral',  text:'接收新告警 · CrowdStrike Falcon · 1 条' },
              { time:'10:30:11', tone:'critical', text:'⚠ 触发紧急升级 · EVT-2024031500001 · 待人工确认' },
            ].map((row, i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'auto auto 1fr',
                alignItems:'center', gap:10, padding:'8px 0',
                borderBottom: i < 5 ? '1px dashed var(--border)' : 'none',
              }}>
                <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{row.time}</span>
                <UI.Dot tone={row.tone} size={6}/>
                <span className={row.mono ? 'mono' : ''} style={{ fontSize:12.5, color: row.tone === 'critical' ? '#b91c1c' : 'var(--foreground)' }}>{row.text}</span>
              </div>
            ))}
          </div>
        </UI.Card>

        <UI.Card style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600 }}>数据源健康度</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('settings')}>
              管理 <Icons.ArrowR size={12}/>
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {allSources.map(s => (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <UI.Dot tone={s.status === 'active' ? 'success' : s.status === 'error' ? 'destructive' : 'neutral'} pulse={s.status === 'active'} />
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--foreground)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted-foreground)' }}>
                    {s.type.toUpperCase()} · 今日 {(s.alertCount || s.logCount || 0).toLocaleString()} 条
                  </div>
                </div>
                {s.status === 'error'    && <UI.Badge tone="destructive">异常</UI.Badge>}
                {s.status === 'inactive' && <UI.Badge variant="muted">休眠</UI.Badge>}
              </div>
            ))}
          </div>
        </UI.Card>
      </div>
    </div>
  );
}

function HeroSection({ onNavigate }) {
  return (
    <UI.Card style={{
      padding:'40px 44px', position:'relative', overflow:'hidden',
      background:'#fff',
    }}>
      <ChipDecoration />

      <div style={{ position:'relative', zIndex:1 }}>
        {/* Brand logo in hero */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <svg width="30" height="30" viewBox="0 0 30.355 32" fill="none">
            <path fillRule="evenodd" fill="#22c55e"
              d="M2.773,11.967C9.437,11.967,15.413,8.101,18.204,2.202C18.71,1.133,17.863,0,16.681,0L4.67,0C2.091,0,0,2.091,0,4.67L0,10.253C0,11.111,0.61,11.851,1.465,11.916C1.9,11.95,2.336,11.967,2.773,11.967ZM19.264,11.237C19.264,7.368,20.578,3.621,22.977,0.606C23.292,0.21,23.772,0,24.278,0L25.685,0C28.264,0,30.355,2.091,30.355,4.67L30.355,18.035C30.355,19.373,29.781,20.646,28.779,21.533L26.62,23.443C25.976,24.013,25.009,24.04,24.395,23.439C21.128,20.242,19.264,15.849,19.264,11.237ZM5.691,14.593C13.092,14.593,19.605,19.353,21.901,26.303C22.109,26.93,21.897,27.62,21.403,28.057L18.271,30.828C16.505,32.39,13.85,32.39,12.083,30.828L1.576,21.533C0.574,20.646,0,19.373,0,18.035L0,16.808C0,16.066,0.469,15.395,1.185,15.199C2.651,14.797,4.167,14.593,5.691,14.593Z"
            />
          </svg>
          <span style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em' }}>
            <span style={{ color:'#030914' }}>Sec</span><span style={{ color:'#22c55e' }}>mind</span>
          </span>
        </div>

        <div style={{ fontSize:12.5, color:'var(--muted-foreground)', marginBottom:10 }}>欢迎回来，尊敬的 <span style={{ color:'var(--foreground)' }}>李明</span></div>
        <h1 style={{
          fontSize:44, fontWeight:700, margin:'0 0 24px',
          letterSpacing:'-0.025em', lineHeight:1.1,
        }}>
          <span style={{ color:'var(--brand)' }}>秒级</span>
          <span>研判，</span>
          <span style={{ color:'var(--brand)' }}>分钟</span>
          <span>处置</span>
        </h1>
        <button onClick={() => onNavigate('events')} style={{
          display:'inline-flex', alignItems:'center', gap:10,
          padding:'10px 18px 10px 12px', height:44,
          background:'#0a0a0a', color:'#fff', border:0, borderRadius:999,
          fontSize:14, fontWeight:500, fontFamily:'inherit', cursor:'pointer',
          boxShadow:'0 4px 14px -2px rgba(0,0,0,0.2)',
          transition:'transform .12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
          <BrandOrb size={28} />
          从简单交流开始
          <Icons.ArrowR size={14} />
        </button>
      </div>
    </UI.Card>
  );
}

function ChipDecoration() {
  return (
    <svg viewBox="0 0 600 300" style={{
      position:'absolute', right:-10, top:-10, height:'calc(100% + 20px)', width:'auto',
      maxWidth:'62%', opacity:1, pointerEvents:'none',
    }}>
      <g stroke="#e4e4e7" strokeWidth="1" fill="none" opacity="0.7">
        <path d="M0 60 L180 60 L210 90 L420 90"/>
        <path d="M0 110 L120 110 L150 80 L380 80"/>
        <path d="M0 170 L200 170 L230 200 L430 200"/>
        <path d="M0 220 L160 220 L190 250 L450 250"/>
        <path d="M250 0 L250 40 L280 70 L280 140"/>
        <path d="M340 0 L340 60 L370 90 L370 180"/>
      </g>
      <g fill="#d4d4d8">
        <circle cx="180" cy="60" r="2"/>
        <circle cx="210" cy="90" r="2"/>
        <circle cx="120" cy="110" r="2"/>
        <circle cx="200" cy="170" r="2"/>
        <circle cx="280" cy="70" r="2"/>
        <circle cx="370" cy="90" r="2"/>
      </g>
      <text x="280" y="40" fill="#e4e4e7" fontSize="14" fontWeight="600" fontFamily="Inter">NEX 2.0</text>
      <text x="380" y="170" fill="#e4e4e7" fontSize="11" fontFamily="Inter">NXR AI</text>

      {/* Main chip with SecMind icon */}
      <g transform="translate(440, 110)">
        <g fill="#86efac">
          {[0,1,2,3,4,5].map(i => <rect key={`l-${i}`} x="-8" y={10 + i * 14} width="8" height="6" rx="1"/>)}
          {[0,1,2,3,4,5].map(i => <rect key={`r-${i}`} x="100" y={10 + i * 14} width="8" height="6" rx="1"/>)}
          {[0,1,2,3,4,5].map(i => <rect key={`t-${i}`} x={10 + i * 14} y="-8" width="6" height="8" rx="1"/>)}
          {[0,1,2,3,4,5].map(i => <rect key={`b-${i}`} x={10 + i * 14} y="100" width="6" height="8" rx="1"/>)}
        </g>
        <rect x="0" y="0" width="100" height="100" rx="14" fill="#22c55e"/>
        <rect x="6" y="6" width="88" height="88" rx="10" fill="#16a34a" opacity="0.6"/>
        {/* SecMind icon paths scaled to fit inside chip */}
        <g transform="translate(18, 18) scale(2.1)">
          <path fillRule="evenodd" fill="#dcfce7"
            d="M1.3,5.7C4.5,5.7,7.4,3.9,8.7,1.1C9,0.5,8.6,0,7.9,0L2.2,0C1,0,0,1,0,2.2L0,4.9C0,5.3,0.3,5.7,0.7,5.7C0.9,5.7,1.1,5.7,1.3,5.7ZM9.2,5.4C9.2,3.5,9.9,1.7,11,0.3C11.2,0.1,11.4,0,11.6,0L12.3,0C13.5,0,14.5,1,14.5,2.2L14.5,8.6C14.5,9.3,14.2,9.9,13.7,10.3L12.7,11.2C12.4,11.4,11.9,11.5,11.6,11.2C10,9.7,9.2,7.6,9.2,5.4ZM2.7,7C6.3,7,9.4,9.2,10.5,12.6C10.6,12.9,10.5,13.2,10.2,13.5L8.7,14.7C7.9,15.4,6.6,15.4,5.8,14.7L0.8,10.3C0.3,9.9,0,9.3,0,8.6L0,8C0,7.7,0.2,7.4,0.6,7.3C1.3,7.1,2,7,2.7,7Z"
          />
        </g>
        <text x="50" y="74" textAnchor="middle" fill="#dcfce7" fontSize="6.5" fontFamily="JetBrains Mono" opacity="0.85">SE-IDIBCE</text>
      </g>
    </svg>
  );
}

function BrandOrb({ size=24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <radialGradient id="orb-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#bbf7d0"/>
          <stop offset="50%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#14532d"/>
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#orb-grad)"/>
      <ellipse cx="12" cy="11" rx="5" ry="3" fill="#fff" opacity="0.45"/>
    </svg>
  );
}

function KpiInline({ iconBg, iconFg, iconKey, value, label, plain, trend }) {
  const Icon = iconKey ? Icons[iconKey] : null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      {!plain && Icon && (
        <div style={{
          width:42, height:42, borderRadius:10,
          background: iconBg, color: iconFg,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon size={20}/>
        </div>
      )}
      {plain && trend === 'up' && (
        <div style={{ color:'var(--brand-emphasis)' }}><Icons.Trend size={28} style={{ transform:'scaleY(-1)' }}/></div>
      )}
      <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
        <span style={{ fontSize:32, fontWeight:600, letterSpacing:'-0.025em' }}>{value}</span>
        <span style={{ fontSize:13, color:'var(--muted-foreground)' }}>{label}</span>
      </div>
    </div>
  );
}

function TrendStat({ label, value, brand }) {
  return (
    <div>
      <div style={{ fontSize:11.5, color:'var(--muted-foreground)' }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.02em', marginTop:2 }}>{value}</div>
    </div>
  );
}

function ResourceCard({ label, value, unit, iconKey, brand }) {
  const Icon = Icons[iconKey];
  return (
    <UI.Card style={{ padding:'24px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <span style={{ fontSize:13, color:'var(--muted-foreground)' }}>{label}</span>
        <Icon size={16} style={{ color: brand ? 'var(--brand)' : 'var(--muted-foreground)' }}/>
      </div>
      <div className="mono" style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        <span style={{ fontSize:40, fontWeight:600, letterSpacing:'-0.03em', color:'var(--foreground)' }}>{value}</span>
        <span style={{ fontSize:18, color:'var(--muted-foreground)' }}>{unit}</span>
      </div>
    </UI.Card>
  );
}

function BreakdownItem({ color, label, value, unit }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:color }}/>
        <span style={{ fontSize:11.5, color:'var(--muted-foreground)' }}>{label}</span>
      </div>
      <div style={{ height:2, background:color, borderRadius:1, marginBottom:8 }}/>
      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        <span className="mono" style={{ fontSize:18, fontWeight:600, letterSpacing:'-0.02em' }}>{value}</span>
        <span style={{ fontSize:11.5, color:'var(--muted-foreground)' }}>{unit}</span>
      </div>
    </div>
  );
}

function DualLineChart({ data, height=200 }) {
  const W = 640, H = height;
  const padL = 30, padR = 12, padT = 12, padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxY = 1500;
  const x = i => padL + (i / (data.length - 1)) * innerW;
  const y = v => padT + innerH - (v / maxY) * innerH;
  const linePath = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(' ');
  const yTicks = [0, 300, 600, 900, 1200, 1500];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display:'block' }}>
      <defs>
        <linearGradient id="brandFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#f4f4f5" strokeWidth="1"/>
          <text x={padL - 6} y={y(t) + 3} fontSize="10" fill="#a1a1aa" textAnchor="end" fontFamily="JetBrains Mono, monospace">{t.toLocaleString()}</text>
        </g>
      ))}
      <path d={`${linePath('created')} L ${x(data.length-1)} ${y(0)} L ${x(0)} ${y(0)} Z`} fill="url(#brandFill)"/>
      <path d={linePath('created')} fill="none" stroke="#22c55e" strokeWidth="1.5"/>
      <path d={linePath('closed')} fill="none" stroke="#ef4444" strokeWidth="1.5"/>
      {data.map((d, i) => i % 3 === 0 ? (
        <text key={i} x={x(i)} y={H - 8} fontSize="10" fill="#a1a1aa" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{d.label}</text>
      ) : null)}
    </svg>
  );
}

function generateTrend() {
  const out = [];
  const labels = ['Nov 14','Nov 17','Nov 20','Nov 23','Nov 26','Nov 29','Dec 02','Dec 05','Dec 08','Dec 11','Dec 14'];
  for (let i = 0; i < 33; i++) {
    const idx = Math.floor(i / 3);
    let created = 20 + Math.random() * 30;
    let closed  = 15 + Math.random() * 25;
    if (i >= 14 && i <= 16) { created = 700 + i * 150; closed = 200 + i * 80; }
    if (i === 15) { created = 1380; closed = 1200; }
    if (i > 16) { created = 30 + Math.random() * 80; closed = 25 + Math.random() * 90; }
    out.push({ created: Math.round(created), closed: Math.round(closed), label: labels[idx] || '' });
  }
  return out;
}


/* Events List — 事件中心 v2 */

const { useState: useStateEvents, useMemo: useMemoEvents } = React;

/* Category tab definitions */
const EVENT_CATEGORY_TABS = [
  { key:'all',           label:'全部事件',   filter: () => true },
  { key:'pending_human', label:'需人工介入',  filter: e => e.investigationStatus === 'pending_human' },
  { key:'attention',     label:'引起注意',    filter: e => (e.priority === 'critical' || e.priority === 'high') && e.investigationStatus !== 'closed' },
  { key:'uninvestigated',label:'未调查事件',  filter: e => e.processStatus === 'pending' },
];

function EventsPage({ onNavigate }) {
  const [category, setCategory] = useStateEvents('all');
  const [q, setQ] = useStateEvents('');
  const [priority, setPriority] = useStateEvents('all');
  const [scene, setScene] = useStateEvents('all');
  const [timeRange, setTimeRange] = useStateEvents('24h');
  const [view, setView] = useStateEvents('list');

  const catTab = EVENT_CATEGORY_TABS.find(t => t.key === category) || EVENT_CATEGORY_TABS[0];

  const filtered = useMemoEvents(() => mockEvents.filter(e => {
    if (!catTab.filter(e)) return false;
    if (q) {
      const k = q.toLowerCase();
      const match = e.title.toLowerCase().includes(k)
        || e.id.toLowerCase().includes(k)
        || e.entities.some(en => en.value.toLowerCase().includes(k));
      if (!match) return false;
    }
    if (priority !== 'all' && e.priority !== priority) return false;
    if (scene !== 'all' && e.sceneCategory !== scene) return false;
    return true;
  }), [q, priority, scene, category]);

  const allEvents = mockEvents;
  const counts = {
    all:           allEvents.length,
    pending_human: allEvents.filter(e => e.investigationStatus === 'pending_human').length,
    attention:     allEvents.filter(e => (e.priority === 'critical' || e.priority === 'high') && e.investigationStatus !== 'closed').length,
    uninvestigated:allEvents.filter(e => e.processStatus === 'pending').length,
    critical: filtered.filter(e => e.priority === 'critical').length,
    high:     filtered.filter(e => e.priority === 'high').length,
    medium:   filtered.filter(e => e.priority === 'medium').length,
    low:      filtered.filter(e => e.priority === 'low').length,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <UI.SectionTitle
        title="事件中心"
        subtitle="管理和处置 AI 调查后的安全事件"
        action={
          <div style={{ display:'flex', gap:8 }}>
            <UI.Button leftIcon={<Icons.Refresh size={14}/>}>刷新</UI.Button>
          </div>
        }
      />

      {/* Category tabs */}
      <div style={{ display:'flex', gap:4, padding:'2px 0' }}>
        {EVENT_CATEGORY_TABS.map(tab => {
          const active = category === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                height:36, padding:'0 14px',
                background: active ? 'var(--brand-soft)' : '#fff',
                color: active ? 'var(--brand-emphasis)' : 'var(--muted-foreground)',
                border: active ? '1px solid var(--brand-200)' : '1px solid var(--border)',
                borderRadius:8, cursor:'pointer',
                fontSize:13, fontWeight: active ? 600 : 400,
                transition:'all .12s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--muted-2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#fff'; }}
            >
              {tab.label}
              <span style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                minWidth:20, height:18, padding:'0 5px',
                borderRadius:9, fontSize:11, fontWeight:600,
                background: active ? 'var(--brand-200)' : 'var(--muted)',
                color: active ? 'var(--brand-emphasis)' : 'var(--muted-foreground)',
              }}>{counts[tab.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Summary stats strip */}
      <UI.Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)' }}>
          <StatStripCell label="本次筛选" value={filtered.length} sub="条事件" />
          <StatStripCell label="紧急" value={counts.critical} tone="critical" />
          <StatStripCell label="高" value={counts.high} tone="high" />
          <StatStripCell label="中" value={counts.medium} tone="medium" />
          <StatStripCell label="低" value={counts.low} tone="low" />
        </div>
      </UI.Card>

      {/* Filter bar */}
      <UI.Card style={{ padding:'10px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 240px', minWidth:200 }}>
            <UI.Input
              placeholder="搜索事件标题、ID 或实体（账号、IP、域名）…"
              value={q}
              onChange={e => setQ(e.target.value)}
              leftIcon={<Icons.Search size={14}/>}
            />
          </div>
          <UI.Select value={timeRange} onChange={setTimeRange} options={[
            { value:'1h',  label:'近 1 小时' },
            { value:'24h', label:'近 24 小时' },
            { value:'7d',  label:'近 7 天' },
            { value:'30d', label:'近 30 天' },
          ]} width={130} />
          <UI.Select value={priority} onChange={setPriority} options={[
            { value:'all', label:'全部优先级' },
            { value:'critical', label:'紧急' }, { value:'high', label:'高' },
            { value:'medium', label:'中' }, { value:'low', label:'低' },
          ]} width={130} />
          <UI.Select value={scene} onChange={setScene} options={[
            { value:'all', label:'全部场景' },
            ...Object.entries(SCENE_CONFIG).map(([k, v]) => ({ value:k, label:v.label })),
          ]} width={130} />
          <div style={{ flex:1 }} />
          <UI.Tabs value={view} onChange={setView} size="sm" items={[
            { value:'list', label:'列表', icon:<Icons.Activity size={13}/> },
            { value:'board', label:'看板', icon:<Icons.Dashboard size={13}/> },
          ]} />
        </div>
      </UI.Card>

      {/* List view */}
      {view === 'list' && (
        <UI.Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{
            display:'grid',
            gridTemplateColumns:'180px 1fr 220px 130px 90px 40px',
            gap:12, padding:'10px 16px',
            background:'var(--muted-2)', borderBottom:'1px solid var(--border)',
            fontSize:11, color:'var(--muted-foreground)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em',
          }}>
            <span>事件 ID / 优先级</span>
            <span>事件</span>
            <span>关键实体</span>
            <span>调查状态</span>
            <span>负责人</span>
            <span></span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--muted-foreground)' }}>
              <Icons.Search size={20} style={{ opacity:0.4 }}/>
              <div style={{ fontSize:13, marginTop:8 }}>未找到匹配的事件</div>
            </div>
          ) : filtered.map((e, i) => (
            <EventListRow key={e.id} event={e} onClick={() => onNavigate('events/' + e.id)} divider={i < filtered.length - 1} />
          ))}
        </UI.Card>
      )}

      {/* Board view */}
      {view === 'board' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, alignItems:'flex-start' }}>
          {[
            { key:'investigating', label:'调查中', icon:<Icons.Loader size={14} className="spin"/> },
            { key:'pending_human', label:'需人工介入', icon:<Icons.User size={14}/> },
            { key:'completed',     label:'已完成',  icon:<Icons.Check size={14}/> },
            { key:'closed',        label:'已关闭',  icon:<Icons.Lock size={14}/> },
          ].map(col => {
            const items = filtered.filter(e => e.investigationStatus === col.key);
            return (
              <div key={col.key}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 4px 10px' }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600 }}>
                    {col.icon}{col.label}
                  </div>
                  <UI.Badge variant="muted">{items.length}</UI.Badge>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {items.length === 0 ? (
                    <div style={{ padding:20, textAlign:'center', fontSize:12, color:'var(--muted-foreground)', border:'1px dashed var(--border)', borderRadius:8 }}>暂无</div>
                  ) : items.map(e => (
                    <EventBoardCard key={e.id} event={e} onClick={() => onNavigate('events/' + e.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'var(--muted-foreground)' }}>
        <span>显示 {filtered.length} 条 / 共 {mockEvents.length} 条</span>
        <div style={{ display:'flex', gap:6 }}>
          <UI.Button size="sm" disabled>上一页</UI.Button>
          <UI.Button size="sm" disabled>下一页</UI.Button>
        </div>
      </div>
    </div>
  );
}

function StatStripCell({ label, value, sub, tone }) {
  return (
    <div style={{ padding:'14px 16px', borderRight:'1px solid var(--border)' }}>
      <div style={{ fontSize:11, color:'var(--muted-foreground)', display:'inline-flex', alignItems:'center', gap:6 }}>
        {tone && <UI.Dot tone={tone} size={6}/>}{label}
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:6 }}>
        <span style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.02em' }}>{value}</span>
        {sub && <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>{sub}</span>}
      </div>
    </div>
  );
}

function formatRel(ts) {
  const d = new Date(ts), now = new Date();
  const diff = now - d;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  if (min < 0) return d.toLocaleString('zh-CN');
  if (min < 60) return `${min} 分钟前`;
  if (hr < 24) return `${hr} 小时前`;
  return d.toLocaleDateString('zh-CN', { month:'2-digit', day:'2-digit' });
}

function EventListRow({ event, onClick, divider }) {
  const sceneIcon = Icons[SCENE_CONFIG[event.sceneCategory].iconKey];
  const Icon = sceneIcon;
  const statusKey = event.investigationStatus;
  const StatusIcon = Icons[INVESTIGATION_STATUS_CONFIG[statusKey].iconKey];
  const showSceneBadge = statusKey !== 'investigating';

  return (
    <div onClick={onClick} className="hover-row" style={{
      display:'grid',
      gridTemplateColumns:'180px 1fr 220px 130px 90px 40px',
      gap:12, padding:'14px 16px', alignItems:'center',
      borderBottom: divider ? '1px solid var(--border)' : 'none',
      cursor:'pointer', transition:'background .12s',
    }}>
      {/* Priority + ID */}
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <UI.Badge tone={event.priority} style={{ alignSelf:'flex-start' }}>
          <UI.Dot tone={event.priority} size={6}/> {PRIORITY_CONFIG[event.priority].label}
        </UI.Badge>
        <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{event.id}</span>
      </div>

      {/* Title + meta */}
      <div style={{ minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:22, height:22, borderRadius:5,
            background:'var(--muted)', color:'var(--foreground)',
          }}>
            <Icon size={13}/>
          </span>
          {showSceneBadge && (
            <UI.Badge variant="muted">{SCENE_CONFIG[event.sceneCategory].label}</UI.Badge>
          )}
        </div>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--foreground)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {event.title}
        </div>
        <div style={{ fontSize:11, color:'var(--muted-foreground)', marginTop:4, display:'flex', alignItems:'center', gap:8 }}>
          <span>{event.sourceSystem}</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--border-strong)' }} />
          <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Icons.Clock size={11}/> {formatRel(event.triggeredAt)}</span>
        </div>
      </div>

      {/* Entities */}
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {event.entities.slice(0, 2).map((en, i) => (
          <span key={i} className="mono" style={{
            fontSize:11, padding:'2px 6px', background:'var(--muted-2)',
            border:'1px solid var(--border)', borderRadius:4, color:'var(--foreground)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%',
          }} title={en.value}>{en.value}</span>
        ))}
        {event.entities.length > 2 && (
          <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>+{event.entities.length - 2} 个实体</span>
        )}
      </div>

      {/* Status */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
        <StatusIcon size={13} className={statusKey === 'investigating' ? 'spin' : ''} style={{ color: statusKey === 'completed' ? 'var(--success)' : statusKey === 'pending_human' ? 'var(--warning)' : 'var(--muted-foreground)' }}/>
        <span style={{ fontSize:12.5 }}>{INVESTIGATION_STATUS_CONFIG[statusKey].label}</span>
      </div>

      {/* Assignee */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {event.assignee ? (
          <>
            <UI.Avatar name={event.assignee.name} size={20} style={{ background:'#fef3c7', color:'#92400e', borderColor:'transparent' }}/>
            <span style={{ fontSize:12 }}>{event.assignee.name}</span>
          </>
        ) : <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>未分配</span>}
      </div>

      {/* More menu */}
      <div onClick={e => e.stopPropagation()} style={{ display:'flex', justifyContent:'flex-end' }}>
        <UI.DropdownMenu
          align="end"
          minWidth={180}
          trigger={<UI.Button variant="ghost" size="icon-sm"><Icons.More size={14}/></UI.Button>}
          items={[
            { label:'生成工单建议', icon:<Icons.File size={13}/>, onSelect:() => {} },
            { label:'关闭', icon:<Icons.Lock size={13}/>, onSelect:() => {} },
            { label:'开启', icon:<Icons.Play size={13}/>, onSelect:() => {} },
          ]}
        />
      </div>
    </div>
  );
}

function EventBoardCard({ event, onClick }) {
  const sceneIcon = Icons[SCENE_CONFIG[event.sceneCategory].iconKey];
  const Icon = sceneIcon;
  return (
    <div onClick={onClick} style={{
      background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:12,
      cursor:'pointer', transition:'border-color .12s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <UI.Badge tone={event.priority}><UI.Dot tone={event.priority} size={6}/> {PRIORITY_CONFIG[event.priority].label}</UI.Badge>
        <span className="mono" style={{ fontSize:10.5, color:'var(--muted-foreground)' }}>{event.id.replace('EVT-2024031500','#')}</span>
      </div>
      <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
        <span style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:22, height:22, borderRadius:5, background:'var(--muted)', flexShrink:0,
        }}>
          <Icon size={13}/>
        </span>
        <div style={{ fontSize:12.5, lineHeight:1.4, color:'var(--foreground)' }}>{event.title}</div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'var(--muted-foreground)' }}>
        <span>{formatRel(event.triggeredAt)}</span>
        <span>{SCENE_CONFIG[event.sceneCategory].label}</span>
      </div>
    </div>
  );
}

/* Event Detail page — 事件详情 v2 */

const { useState: useStateDetail, useEffect: useEffectDetail, useRef: useRefDetail } = React;

/* ─── AI Analysis data per event ─── */
function buildAIAnalysisItems(event) {
  const mainAccount = event.entities.find(e => e.type === 'account')?.value || '未知账号';
  const mainIP      = event.entities.find(e => e.type === 'ip')?.value     || '未知IP';
  const mainDomain  = event.entities.find(e => e.type === 'domain')?.value;
  const mainDevice  = event.entities.find(e => e.type === 'device')?.value;
  const sc          = SCENE_CONFIG[event.sceneCategory].label;
  const pri         = PRIORITY_CONFIG[event.priority].label;
  const isCompleted = event.investigationStatus === 'completed';

  const completedTime = isCompleted
    ? new Date(new Date(event.triggeredAt).getTime() + 3 * 60000 + 12000).toLocaleString('zh-CN')
    : '调查进行中…';

  // ---- Phishing-specific content (EVT-001) ----
  if (event.sceneCategory === 'phishing') {
    return [
      { type:'section', label:'事件基本信息' },
      { type:'field', label:'事件来源', value: event.sourceSystem },
      { type:'field', label:'事件类型', value: sc },
      { type:'field', label:'事件 ID', value: event.id, mono:true },
      { type:'field', label:'事件开始时间', value: new Date(event.triggeredAt).toLocaleString('zh-CN') },
      { type:'field', label:'事件调查完成时间', value: completedTime },
      { type:'field', label:'调查结果', value: isCompleted ? '确认威胁' : '调查中', tone: isCompleted ? 'critical' : 'neutral' },

      { type:'section', label:'事件摘要' },
      { type:'field', label:'事件发生时间', value: new Date(event.triggeredAt).toLocaleString('zh-CN') },
      { type:'field', label:'事件等级', value: pri, tone: event.priority },
      { type:'field', label:'事件标题', value: event.title },
      { type:'field', label:'事件内容', value:`用户 ${mainAccount} 点击了伪装成 Microsoft 支持的钓鱼链接，并在仿冒页面提交了企业账号凭据。告警由 Proofpoint TAP 触发，检测到高可信度钓鱼攻击特征。` },
      { type:'field', label:'触发安全策略', value:'邮件钓鱼检测策略 · 凭据提交监控策略 · 恶意 URL 拦截规则' },
      { type:'field', label:'关联资产', value: event.entities.map(e => e.value).join('、') },

      { type:'section', label:'事件调查分析' },
      { type:'step', index:1, title:'告警日志分析', content:`检索 Proofpoint TAP 原始告警，确认用户 ${mainAccount} 于 ${new Date(event.triggeredAt).toLocaleTimeString('zh-CN')} 点击邮件内链接 http://micros0ft-support.com/login?ref=urgent。`, log:`2024-03-15T01:23:11Z TAP_URL_CLICK user=${mainAccount} url=http://micros0ft-support.com/login?ref=urgent verdict=phishing confidence=0.97`, highlight:[`${mainAccount}`, 'http://micros0ft-support.com/login?ref=urgent'], interpretation:'Proofpoint 以 0.97 置信度判定为钓鱼链接，URL 包含混淆域名特征（将字母 o 替换为数字 0）。' },
      { type:'step', index:2, title:'IP 威胁情报查询', content:`查询源 IP ${mainIP} 的威胁情报，确认为已知 Tor 出口节点，关联多起钓鱼活动。`, log:`threat_intel lookup ip=${mainIP}\n=> {"type":"tor_exit","malicious":true,"campaigns":["APT-Phish-22","TA453"],"score":95}`, highlight:[mainIP], interpretation:`IP ${mainIP} 属于 Tor 匿名网络出口节点，历史上曾被多个 APT 组织用于鱼叉式钓鱼攻击。` },
      { type:'step', index:3, title:'凭据提交行为确认', content:`分析 Web 代理日志，确认用户在钓鱼页面完成 POST 提交，凭据已发送至攻击者控制服务器。`, log:`2024-03-15T01:23:18Z PROXY POST http://micros0ft-support.com/api/auth user=${mainAccount} bytes_sent=312 status=200`, highlight:[`${mainAccount}`, 'micros0ft-support.com'], interpretation:'POST 请求返回 HTTP 200，表明凭据提交成功，账号极可能已泄露。' },
      { type:'step', index:4, title:'账号活动异常检测', content:`查询 Azure AD 登录日志，发现凭据提交后 4 分钟内出现来自境外 IP 的登录尝试。`, log:`2024-03-15T01:27:09Z AZURE_AD LOGIN user=${mainAccount} ip=185.220.101.34 location=NL result=success mfa=bypassed`, highlight:[`${mainAccount}`, '185.220.101.34'], interpretation:'攻击者在获取凭据后立即尝试登录并成功绕过 MFA，账号已被接管。' },

      { type:'section', label:'初步研判结论' },
      { type:'verdict', level:'高危', tone:'critical' },
      { type:'field', label:'事件定性结论', value:`${mainAccount} 遭受精准钓鱼攻击，凭据已被窃取并确认发生账号接管（ATO），攻击者通过 Tor 节点规避追踪，当前账号存在极高数据泄露风险。` },
      { type:'logblock', label:'证据结论', content:`[证据1] Proofpoint: url_click confidence=0.97 → phishing\n[证据2] Proxy: POST micros0ft-support.com → 200 OK\n[证据3] Azure AD: login from 185.220.101.34 (NL) → success + MFA_bypassed` },

      { type:'section', label:'威胁路径还原' },
      { type:'timeline', phases:[
        { id:'T1', name:'初始访问', desc:'收到钓鱼邮件并点击链接' },
        { id:'T2', name:'凭据收集', desc:'伪造页面窃取账号密码' },
        { id:'T3', name:'账号接管', desc:'攻击者远程登录企业账号' },
        { id:'T4', name:'权限维持', desc:'探测 IAM 权限范围' },
      ]},
      { type:'field', label:'威胁意图 / 手段', value:'通过精心构造的仿冒 Microsoft 支持页面实施凭据网络钓鱼，利用 Tor 网络隐匿攻击源，目标为获取高权限账号以进行横向渗透或数据外泄。' },

      { type:'section', label:'威胁方式（ATT&CK）' },
      { type:'attack', techniques:[
        { id:'T1566.002', name:'Phishing: Spearphishing Link',  tactic:'Initial Access' },
        { id:'T1078',     name:'Valid Accounts',                tactic:'Defense Evasion' },
        { id:'T1556',     name:'Modify Authentication Process', tactic:'Credential Access' },
        { id:'T1090',     name:'Proxy: Multi-hop Proxy (Tor)',  tactic:'Command & Control' },
      ]},

      { type:'section', label:'威胁情报来源' },
      { type:'intel', sources:[
        { name:'Proofpoint Threat Intel', match:`URL ${mainDomain || 'micros0ft-support.com'} 命中钓鱼数据库`, confidence:'高' },
        { name:'AbuseIPDB / Tor Exit List', match:`IP ${mainIP} 确认为 Tor 出口节点`, confidence:'高' },
        { name:'MITRE ATT&CK', match:'战术映射完成', confidence:'高' },
      ]},

      { type:'section', label:'受影响描述' },
      { type:'field', label:'受影响资产', value: mainAccount + (mainDevice ? `、${mainDevice}` : '') },
      { type:'field', label:'定性结论', value:'账号接管（ATO）确认，凭据泄露，需立即重置密码并吊销所有活跃会话。' },
      { type:'field', label:'影响范围', value:`受影响账号 ${mainAccount} 为财务部高价值账号，拥有 SharePoint 敏感文件访问权限及 ERP 系统写权限。攻击者若利用该账号进行横向移动，可能导致财务数据、客户合同等敏感文件泄露，影响规模评估为高。` },

      { type:'section', label:'最终结论' },
      { type:'final', items:[
        { label:'事件威胁定性', value:'确认威胁 — 账号接管（Account Takeover）' },
        { label:'事件级别', value:'P0 紧急', tone:'critical' },
        { label:'受影响资产', value: mainAccount },
        { label:'威胁特征提取', value:'混淆域名钓鱼 + Tor 匿名 + MFA 绕过 + 即时ATO' },
      ]},

      { type:'section', label:'处置建议' },
      { type:'remediation', groups:[
        { level:'immediate', title:'立即执行', items:[
          '立即重置 ' + mainAccount + ' 账号密码并强制注销所有活跃会话',
          '封锁 IP ' + mainIP + ' 及关联 Tor 出口节点段',
          '吊销账号所有 OAuth 授权令牌与 MFA 设备',
        ]},
        { level:'week', title:'7 天跟踪', items:[
          '审查账号近 30 天所有操作日志，识别潜在数据访问行为',
          '检查同部门账号是否收到同类钓鱼邮件',
          '对财务部高权限账号开启强制 FIDO2 硬件密钥认证',
        ]},
        { level:'longterm', title:'长期建议', items:[
          '部署邮件防伪技术（DMARC/DKIM/SPF）并加强 URL 沙箱检测',
          '对全体员工开展钓鱼模拟演练与安全意识培训',
        ]},
      ]},
    ];
  }

  // ---- Identity / Brute-force content (EVT-002, EVT-003, EVT-010) ----
  if (event.sceneCategory === 'identity') {
    const failCount = event.id.endsWith('002') ? 87 : event.id.endsWith('010') ? 23 : 15;
    return [
      { type:'section', label:'事件基本信息' },
      { type:'field', label:'事件来源', value: event.sourceSystem },
      { type:'field', label:'事件类型', value: sc },
      { type:'field', label:'事件 ID', value: event.id, mono:true },
      { type:'field', label:'事件开始时间', value: new Date(event.triggeredAt).toLocaleString('zh-CN') },
      { type:'field', label:'事件调查完成时间', value: completedTime },
      { type:'field', label:'调查结果', value: isCompleted ? '确认威胁' : '调查中', tone: isCompleted ? 'critical' : 'neutral' },

      { type:'section', label:'事件摘要' },
      { type:'field', label:'事件发生时间', value: new Date(event.triggeredAt).toLocaleString('zh-CN') },
      { type:'field', label:'事件等级', value: pri, tone: event.priority },
      { type:'field', label:'事件标题', value: event.title },
      { type:'field', label:'事件内容', value:`账号 ${mainAccount} 在短时间内触发异常认证行为。来源 IP ${mainIP} 归属异常，认证频次远超正常水平，疑似凭据填充或暴力破解攻击。` },
      { type:'field', label:'触发安全策略', value:'异常登录频率告警 · 来源 IP 黑名单策略 · 账号锁定阈值规则' },
      { type:'field', label:'关联资产', value: event.entities.map(e => e.value).join('、') },

      { type:'section', label:'事件调查分析' },
      { type:'step', index:1, title:'认证日志分析', content:`检索 ${event.sourceSystem} 认证日志，确认 ${mainAccount} 在 5 分钟内遭受 ${failCount} 次登录失败。`, log:`2024-03-15 AUTH_FAIL user=${mainAccount} ip=${mainIP} count=${failCount} window=5min\nPattern: sequential_passwords → credential_stuffing_suspected`, highlight:[mainAccount, mainIP], interpretation:`${failCount} 次/5分钟的失败频率远超正常人工操作上限，符合自动化凭据填充攻击特征。` },
      { type:'step', index:2, title:'来源 IP 情报核查', content:`查询 IP ${mainIP} 威胁情报，确认为已知恶意 IP 段，历史上关联多个凭据填充工具集。`, log:`threat_intel lookup ip=${mainIP}\n=> {"category":"botnet_c2","risk_score":89,"known_tools":["CredStuffPro","Sentry MBA"]}`, highlight:[mainIP], interpretation:`IP ${mainIP} 已被多个威胁情报源标记为恶意，确认攻击使用了自动化工具。` },
      { type:'step', index:3, title:'账号锁定状态核查', content:'确认账号当前锁定状态及是否有成功登录记录。', log:`AD_QUERY user=${mainAccount}\n=> {"status":"locked","last_success":"none_in_window","failed_attempts":${failCount}}`, highlight:[mainAccount], interpretation:'账号已被自动锁定，当前无成功登录记录，凭据尚未被成功利用。' },

      { type:'section', label:'初步研判结论' },
      { type:'verdict', level: event.priority === 'critical' ? '高危' : '疑似', tone: event.priority === 'critical' ? 'critical' : 'high' },
      { type:'field', label:'事件定性结论', value:`账号 ${mainAccount} 遭受来自已知恶意 IP 的凭据填充攻击，${failCount} 次登录失败，账号已自动锁定，当前无成功入侵证据，但需持续监控。` },
      { type:'logblock', label:'证据结论', content:`[证据1] 认证日志: ${failCount} 次失败/5min from ${mainIP}\n[证据2] 威胁情报: ${mainIP} → botnet_c2 risk=89\n[证据3] AD 查询: 账号已锁定，无成功登录` },

      { type:'section', label:'威胁路径还原' },
      { type:'timeline', phases:[
        { id:'T1', name:'侦察', desc:'获取目标账号列表' },
        { id:'T2', name:'初始攻击', desc:'发起凭据填充攻击' },
        { id:'T3', name:'账号枚举', desc:'确认有效账号' },
      ]},
      { type:'field', label:'威胁意图 / 手段', value:`攻击者使用已泄露凭据数据库通过自动化工具（疑为 CredStuffPro）对 ${mainAccount} 进行凭据填充，意图非法获取账号访问权限进而实施内部侦察或数据外泄。` },

      { type:'section', label:'威胁方式（ATT&CK）' },
      { type:'attack', techniques:[
        { id:'T1110.004', name:'Credential Stuffing', tactic:'Credential Access' },
        { id:'T1078',     name:'Valid Accounts',      tactic:'Defense Evasion' },
        { id:'T1589.001', name:'Account Discovery',   tactic:'Reconnaissance' },
      ]},

      { type:'section', label:'威胁情报来源' },
      { type:'intel', sources:[
        { name:'AbuseIPDB', match:`IP ${mainIP} 恶意评分 89/100`, confidence:'高' },
        { name:'Have I Been Pwned', match:`${mainAccount} 关联泄露数据库`, confidence:'中' },
        { name:'MITRE ATT&CK', match:'凭据填充战术映射', confidence:'高' },
      ]},

      { type:'section', label:'受影响描述' },
      { type:'field', label:'受影响资产', value: mainAccount },
      { type:'field', label:'定性结论', value:'暴力破解 / 凭据填充攻击，当前无成功入侵，需重置密码并强化 MFA。' },
      { type:'field', label:'影响范围', value:`账号 ${mainAccount} 存在凭据泄露风险。若攻击成功，攻击者可访问与该账号关联的所有企业系统。当前账号已锁定，实际数据泄露风险处于低位，但若不及时处置，后续可能遭受更复杂的针对性攻击。` },

      { type:'section', label:'最终结论' },
      { type:'final', items:[
        { label:'事件威胁定性', value:'凭据填充攻击 — 账号暂未失陷' },
        { label:'事件级别', value: pri, tone: event.priority },
        { label:'受影响资产', value: mainAccount },
        { label:'威胁特征提取', value:'自动化凭据填充 + 已知恶意 IP + 账号锁定触发' },
      ]},

      { type:'section', label:'处置建议' },
      { type:'remediation', groups:[
        { level:'immediate', title:'立即执行', items:[
          '强制重置 ' + mainAccount + ' 账号密码并解锁账号',
          '封锁来源 IP ' + mainIP + ' 及其 /24 网段',
          '启用账号 FIDO2 硬件密钥强制认证',
        ]},
        { level:'week', title:'7 天跟踪', items:[
          '持续监控 ' + mainAccount + ' 登录行为异常',
          '排查是否有其他账号遭受同一 IP 攻击',
        ]},
        { level:'longterm', title:'长期建议', items:[
          '部署 Bot 防护机制，限制单 IP 认证频率',
          '接入 HaveIBeenPwned API，对泄露密码实施主动重置策略',
        ]},
      ]},
    ];
  }

  // ---- Generic fallback for other categories ----
  return [
    { type:'section', label:'事件基本信息' },
    { type:'field', label:'事件来源', value: event.sourceSystem },
    { type:'field', label:'事件类型', value: sc },
    { type:'field', label:'事件 ID', value: event.id, mono:true },
    { type:'field', label:'事件开始时间', value: new Date(event.triggeredAt).toLocaleString('zh-CN') },
    { type:'field', label:'事件调查完成时间', value: completedTime },
    { type:'field', label:'调查结果', value: isCompleted ? '确认威胁' : '调查中', tone: isCompleted ? 'critical' : 'neutral' },

    { type:'section', label:'事件摘要' },
    { type:'field', label:'事件发生时间', value: new Date(event.triggeredAt).toLocaleString('zh-CN') },
    { type:'field', label:'事件等级', value: pri, tone: event.priority },
    { type:'field', label:'事件标题', value: event.title },
    { type:'field', label:'事件内容', value:`${sc}事件，涉及实体 ${mainAccount}（${mainIP}）。系统已自动完成初步分析，待人工复核确认。` },
    { type:'field', label:'触发安全策略', value:`${sc}检测策略 · 行为基线偏差告警` },
    { type:'field', label:'关联资产', value: event.entities.map(e => e.value).join('、') },

    { type:'section', label:'事件调查分析' },
    { type:'step', index:1, title:'告警日志分析', content:`检索 ${event.sourceSystem} 原始告警数据，确认事件触发条件及关键实体信息。`, log:`EVENT_TRIGGER src=${event.sourceSystem} entity=${mainAccount}\nip=${mainIP} timestamp=${event.triggeredAt}\nalert_id=${event.alertId}`, highlight:[mainAccount, mainIP], interpretation:'告警数据与已知攻击模式匹配，初步确认为真实威胁事件。' },
    { type:'step', index:2, title:'实体情报查询', content:`对涉事实体 ${mainIP} 进行威胁情报关联分析。`, log:`threat_intel lookup ip=${mainIP}\n=> {"risk_score":72,"category":"suspicious","first_seen":"2023-11"}`, highlight:[mainIP], interpretation:`IP ${mainIP} 具有一定风险评分，关联历史可疑活动记录。` },

    { type:'section', label:'初步研判结论' },
    { type:'verdict', level: event.priority === 'critical' ? '高危' : event.priority === 'high' ? '疑似' : '低危', tone: event.priority },
    { type:'field', label:'事件定性结论', value:`${sc}事件确认为${event.priority === 'critical' ? '高危威胁' : '潜在威胁'}，涉及实体 ${mainAccount}，需要立即响应处置。` },
    { type:'logblock', label:'证据结论', content:`[证据1] 原始告警: ${event.sourceSystem} → threat detected\n[证据2] 情报查询: ${mainIP} risk_score=72` },

    { type:'section', label:'威胁路径还原' },
    { type:'timeline', phases:[
      { id:'T1', name:'初始访问', desc:'触发安全策略告警' },
      { id:'T2', name:'行为分析', desc:'异常行为模式确认' },
    ]},
    { type:'field', label:'威胁意图 / 手段', value:`疑似利用${sc}手段对目标资产实施渗透，意图获取未授权访问权限。` },

    { type:'section', label:'威胁方式（ATT&CK）' },
    { type:'attack', techniques:[
      { id:'T1190', name:'Exploit Public-Facing Application', tactic:'Initial Access' },
      { id:'T1078', name:'Valid Accounts', tactic:'Defense Evasion' },
    ]},

    { type:'section', label:'威胁情报来源' },
    { type:'intel', sources:[
      { name:'AbuseIPDB', match:`IP ${mainIP} 关联威胁情报`, confidence:'中' },
      { name:'MITRE ATT&CK', match:'战术映射完成', confidence:'高' },
    ]},

    { type:'section', label:'受影响描述' },
    { type:'field', label:'受影响资产', value: mainAccount },
    { type:'field', label:'定性结论', value:`${sc}事件对目标资产构成${event.priority === 'critical' ? '高' : '中等'}级别风险。` },
    { type:'field', label:'影响范围', value:`涉及实体 ${mainAccount}，可能影响相关系统的可用性和数据完整性，需要立即采取防护措施防止威胁扩散。` },

    { type:'section', label:'最终结论' },
    { type:'final', items:[
      { label:'事件威胁定性', value:`${sc} — 需立即处置` },
      { label:'事件级别', value: pri, tone: event.priority },
      { label:'受影响资产', value: mainAccount },
      { label:'威胁特征提取', value:`${sc}特征 + 异常实体行为 + 威胁情报匹配` },
    ]},

    { type:'section', label:'处置建议' },
    { type:'remediation', groups:[
      { level:'immediate', title:'立即执行', items:[
        `隔离 / 封锁涉事 IP ${mainIP}`,
        `对账号 ${mainAccount} 实施紧急权限收缩`,
      ]},
      { level:'week', title:'7 天跟踪', items:[
        '持续监控涉事实体异常行为',
        '审查关联系统访问日志',
      ]},
      { level:'longterm', title:'长期建议', items:[
        '完善安全策略检测规则',
        '加强安全意识培训',
      ]},
    ]},
  ];
}

/* ─── Streaming AI Analysis Tab ─── */
function AIAnalysisTab({ event }) {
  const isInvestigating = event.investigationStatus === 'investigating';
  const items = buildAIAnalysisItems(event);
  const [revealCount, setRevealCount] = useStateDetail(isInvestigating ? 0 : items.length);
  const [done, setDone] = useStateDetail(!isInvestigating);
  const containerRef = useRefDetail(null);

  useEffectDetail(() => {
    if (!isInvestigating) { setRevealCount(items.length); setDone(true); return; }
    setRevealCount(0); setDone(false);
    const id = setInterval(() => {
      setRevealCount(n => {
        if (n >= items.length) { clearInterval(id); setDone(true); return n; }
        return n + 1;
      });
    }, 180);
    return () => clearInterval(id);
  }, [event.id]);

  const visible = items.slice(0, revealCount);
  const progress = items.length > 0 ? (revealCount / items.length) * 100 : 100;

  return (
    <div>
      {/* Streaming header bar */}
      {isInvestigating && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
          background:'var(--brand-soft)', border:'1px solid var(--brand-200)', borderRadius:8, marginBottom:16,
        }}>
          {!done
            ? <Icons.Loader size={14} className="spin" style={{ color:'var(--brand)' }}/>
            : <Icons.Check size={14} style={{ color:'var(--brand)' }}/>}
          <span style={{ fontSize:13, fontWeight:500, color:'var(--brand-emphasis)', flex:1 }}>
            {done ? 'AI 研判分析完成' : 'AI 实时分析中…'}
          </span>
          {!done && (
            <span style={{ fontSize:12, color:'var(--brand-emphasis)', fontFamily:'monospace' }}>
              {revealCount} / {items.length}
            </span>
          )}
          <div style={{ width:120, height:3, background:'var(--brand-200)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'var(--brand)', borderRadius:2, transition:'width .2s' }}/>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {visible.map((item, idx) => <AIItem key={idx} item={item} animate={isInvestigating && idx === revealCount - 1} />)}
        {isInvestigating && !done && (
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 0', color:'var(--muted-foreground)', fontSize:12.5 }}>
            <span style={{ display:'inline-flex', gap:3 }}>
              <span style={{ animation:'blink 1.2s infinite', animationDelay:'0s' }}>●</span>
              <span style={{ animation:'blink 1.2s infinite', animationDelay:'0.4s' }}>●</span>
              <span style={{ animation:'blink 1.2s infinite', animationDelay:'0.8s' }}>●</span>
            </span>
            <span>AI 正在分析中…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AIItem({ item, animate }) {
  const style = animate ? { animation:'fadeSlideIn .25s ease' } : {};

  if (item.type === 'section') {
    return (
      <div style={{ ...style, display:'flex', alignItems:'center', gap:10, margin:'22px 0 10px', paddingBottom:8, borderBottom:'2px solid var(--border)' }}>
        <div style={{ width:4, height:16, background:'var(--brand)', borderRadius:2 }}/>
        <span style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.01em' }}>{item.label}</span>
      </div>
    );
  }

  if (item.type === 'field') {
    const valStyle = {
      fontSize:13, color:'var(--foreground)', lineHeight:1.55,
      ...(item.mono ? { fontFamily:'monospace', fontSize:12.5 } : {}),
    };
    const toneColors = {
      critical: '#dc2626', high: '#d97706', medium: '#0284c7', success: '#16a34a', neutral: 'var(--muted-foreground)',
    };
    return (
      <div style={{ ...style, display:'grid', gridTemplateColumns:'140px 1fr', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontSize:12, color:'var(--muted-foreground)', paddingTop:1 }}>{item.label}</span>
        <span style={{ ...valStyle, color: item.tone ? (toneColors[item.tone] || valStyle.color) : valStyle.color, fontWeight: item.tone ? 600 : 400 }}>
          {item.value}
        </span>
      </div>
    );
  }

  if (item.type === 'step') {
    return (
      <div style={{ ...style, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{
            width:22, height:22, borderRadius:'50%',
            background:'#0a0a0a', color:'#fff', fontSize:11.5, fontWeight:600,
            display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>{item.index}</span>
          <span style={{ fontSize:13.5, fontWeight:600 }}>{item.title}</span>
        </div>
        <p style={{ fontSize:13, color:'var(--foreground)', margin:'0 0 10px', lineHeight:1.6, paddingLeft:30 }}>
          {highlightEntities(item.content, item.highlight)}
        </p>
        {/* Log snippet */}
        <div style={{ marginLeft:30, marginBottom:10 }}>
          <pre className="mono" style={{
            margin:0, padding:'10px 14px',
            background:'#0f172a', color:'#94a3b8',
            fontSize:11.5, lineHeight:1.7,
            borderRadius:6, overflowX:'auto',
            border:'1px solid #1e293b',
          }}>{item.log}</pre>
        </div>
        {/* AI interpretation */}
        <div style={{ marginLeft:30, padding:'10px 14px', background:'var(--brand-soft)', border:'1px solid var(--brand-200)', borderRadius:6 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:'var(--brand-emphasis)', fontWeight:600, marginBottom:4 }}>
            <Icons.Brain size={11}/> AI 解读
          </div>
          <div style={{ fontSize:12.5, color:'var(--foreground)', lineHeight:1.6 }}>{item.interpretation}</div>
        </div>
      </div>
    );
  }

  if (item.type === 'verdict') {
    const toneMap = { critical:'#dc2626', high:'#d97706', medium:'#0284c7', low:'#71717a' };
    const bgMap   = { critical:'#fef2f2', high:'#fffbeb', medium:'#eff6ff', low:'#fafafa' };
    const bdMap   = { critical:'#fecaca', high:'#fde68a', medium:'#bfdbfe', low:'#e4e4e7' };
    const c = toneMap[item.tone] || '#0a0a0a';
    const bg = bgMap[item.tone] || '#fafafa';
    const bd = bdMap[item.tone] || '#e4e4e7';
    return (
      <div style={{ ...style, display:'flex', alignItems:'center', gap:14, padding:'14px 0' }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'8px 20px', borderRadius:8,
          background: bg, border:`1px solid ${bd}`, color: c,
          fontSize:15, fontWeight:700, letterSpacing:'0.01em',
        }}>
          <Icons.Alert size={15}/> 研判结论：{item.level}
        </div>
      </div>
    );
  }

  if (item.type === 'logblock') {
    return (
      <div style={{ ...style, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:12, color:'var(--muted-foreground)', marginBottom:6 }}>{item.label}</div>
        <pre className="mono" style={{
          margin:0, padding:'10px 14px',
          background:'#0f172a', color:'#94a3b8',
          fontSize:11.5, lineHeight:1.7,
          borderRadius:6, overflowX:'auto',
          border:'1px solid #1e293b',
        }}>{item.content}</pre>
      </div>
    );
  }

  if (item.type === 'timeline') {
    return (
      <div style={{ ...style, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:12, color:'var(--muted-foreground)', marginBottom:12 }}>威胁路径 Timeline</div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:0, overflowX:'auto', paddingBottom:4 }}>
          {item.phases.map((p, i) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:110, maxWidth:130 }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  background: i === item.phases.length - 1 ? 'var(--brand)' : '#0a0a0a',
                  color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11.5, fontWeight:700, flexShrink:0,
                }}>{p.id}</div>
                <div style={{ fontSize:12, fontWeight:600, marginTop:8, textAlign:'center' }}>{p.name}</div>
                <div style={{ fontSize:11, color:'var(--muted-foreground)', marginTop:4, textAlign:'center', lineHeight:1.4 }}>{p.desc}</div>
              </div>
              {i < item.phases.length - 1 && (
                <div style={{ display:'flex', alignItems:'center', alignSelf:'flex-start', marginTop:16 }}>
                  <div style={{ width:24, height:1, background:'var(--border-strong)' }}/>
                  <Icons.ChevR size={12} style={{ color:'var(--border-strong)', marginLeft:-4 }}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === 'attack') {
    return (
      <div style={{ ...style, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {item.techniques.map(t => (
            <div key={t.id} style={{
              padding:'8px 12px', borderRadius:6,
              background:'var(--muted-2)', border:'1px solid var(--border)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <span className="mono" style={{ fontSize:11.5, fontWeight:700, color:'var(--brand-emphasis)' }}>{t.id}</span>
                <UI.Badge variant="muted" style={{ fontSize:10 }}>{t.tactic}</UI.Badge>
              </div>
              <div style={{ fontSize:12.5, color:'var(--foreground)' }}>{t.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === 'intel') {
    return (
      <div style={{ ...style, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {item.sources.map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--muted-2)', border:'1px solid var(--border)', borderRadius:6 }}>
              <Icons.Shield size={13} style={{ color:'var(--brand)', flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:2 }}>{s.match}</div>
              </div>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background: s.confidence === '高' ? 'var(--brand-soft)' : 'var(--muted)', color: s.confidence === '高' ? 'var(--brand-emphasis)' : 'var(--muted-foreground)', fontWeight:500 }}>
                置信度：{s.confidence}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === 'final') {
    const toneMap = { critical:'#dc2626', high:'#d97706', medium:'#0284c7', low:'#71717a' };
    return (
      <div style={{ ...style, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {item.items.map((it, i) => (
            <div key={i} style={{ padding:'10px 14px', background:'var(--muted-2)', border:'1px solid var(--border)', borderRadius:6 }}>
              <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:4 }}>{it.label}</div>
              <div style={{ fontSize:13.5, fontWeight:600, color: it.tone ? (toneMap[it.tone] || 'var(--foreground)') : 'var(--foreground)' }}>{it.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === 'remediation') {
    const levelColors = { immediate:{ bg:'#fef2f2', bd:'#fecaca', fg:'#dc2626', label:'立即执行' }, week:{ bg:'#fffbeb', bd:'#fde68a', fg:'#d97706', label:'7天跟踪' }, longterm:{ bg:'var(--muted-2)', bd:'var(--border)', fg:'var(--muted-foreground)', label:'长期建议' } };
    return (
      <div style={{ ...style, padding:'12px 0' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {item.groups.map(g => {
            const c = levelColors[g.level] || levelColors.longterm;
            return (
              <div key={g.level} style={{ border:`1px solid ${c.bd}`, borderRadius:8, overflow:'hidden' }}>
                <div style={{ padding:'8px 14px', background: c.bg, display:'flex', alignItems:'center', gap:8 }}>
                  <Icons.Target size={13} style={{ color: c.fg }}/>
                  <span style={{ fontSize:13, fontWeight:600, color: c.fg }}>{g.title}</span>
                </div>
                <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                  {g.items.map((it, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, lineHeight:1.5 }}>
                      <span style={{ width:18, height:18, borderRadius:'50%', background:'var(--muted)', color:'var(--muted-foreground)', fontSize:11, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{i + 1}</span>
                      <span>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

function highlightEntities(text, highlights) {
  if (!highlights || highlights.length === 0) return text;
  // Split text around highlighted entities and render inline code
  const parts = [];
  let remaining = text;
  const sorted = [...highlights].sort((a, b) => b.length - a.length);

  // Simple: just return text with no React element trick (avoids complex splitting)
  // We'll render highlighted items as inline code spans
  return (
    <span>
      {text.split(new RegExp(`(${sorted.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')).map((part, i) => {
        const isHighlight = highlights.some(h => h === part);
        return isHighlight
          ? <code key={i} className="mono" style={{ background:'var(--muted)', padding:'1px 4px', borderRadius:3, fontSize:'0.9em', color:'var(--foreground)' }}>{part}</code>
          : <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/* ─── Main EventDetailPage ─── */
function EventDetailPage({ eventId, onNavigate }) {
  const event = mockEvents.find(e => e.id === eventId) || mockEvents[0];
  const report = mockReport;
  const [tab, setTab] = useStateDetail('ai_analysis');

  const sceneCfg = SCENE_CONFIG[event.sceneCategory];
  const SceneIcon = Icons[sceneCfg.iconKey];
  const isCompleted = event.investigationStatus === 'completed';
  const isInvestigating = event.investigationStatus === 'investigating';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Back link */}
      <button onClick={() => onNavigate('events')} className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start', paddingLeft:0 }}>
        <Icons.Back size={14}/> 返回事件列表
      </button>

      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'flex-start' }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{
            width:44, height:44, borderRadius:10,
            background:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <SceneIcon size={20}/>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', marginBottom:8 }}>
              <UI.Badge tone={event.priority}><UI.Dot tone={event.priority} size={6}/> {PRIORITY_CONFIG[event.priority].label}优先级</UI.Badge>
              {isCompleted && <UI.Badge variant="muted">{sceneCfg.label}</UI.Badge>}
              <span className="mono" style={{ fontSize:11.5, color:'var(--muted-foreground)' }}>{event.id}</span>
              <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>·</span>
              <span style={{ fontSize:11.5, color:'var(--muted-foreground)' }}>告警 ID: <span className="mono">{event.alertId}</span></span>
            </div>
            <h1 style={{ fontSize:18, fontWeight:600, margin:0, letterSpacing:'-0.01em' }}>{event.title}</h1>
            <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:8, fontSize:12, color:'var(--muted-foreground)' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icons.Clock size={12}/> {new Date(event.triggeredAt).toLocaleString('zh-CN')}</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icons.Server size={12}/> {event.sourceSystem}</span>
              {event.assignee && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <UI.Avatar name={event.assignee.name} size={18} style={{ background:'#fef3c7', color:'#92400e', borderColor:'transparent' }}/>
                  {event.assignee.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <UI.Button leftIcon={<Icons.Share size={14}/>}>分享</UI.Button>
          <UI.Button leftIcon={<Icons.Download size={14}/>}>导出报告</UI.Button>
          <UI.Button leftIcon={<Icons.Network size={14}/>} onClick={() => onNavigate(`events/${event.id}/action-graph`)}>处置流程可视化</UI.Button>
          <UI.Button variant="brand" leftIcon={<Icons.Refresh size={14}/>}>重新调查</UI.Button>
        </div>
      </div>

      {/* AI Conclusion banner */}
      <UI.Card style={{ padding:18, background:'#fff', borderColor:'var(--border)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background: isInvestigating ? '#eff6ff' : '#fef2f2',
            color: isInvestigating ? '#2563eb' : '#b91c1c',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            {isInvestigating ? <Icons.Loader size={16} className="spin"/> : <Icons.Close size={16}/>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <UI.Badge variant="solid"><Icons.Brain size={11}/> AI 研判结论</UI.Badge>
              {isInvestigating
                ? <UI.Badge tone="info">调查进行中</UI.Badge>
                : <UI.Badge tone="destructive">确认威胁</UI.Badge>}
              {!isInvestigating && <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>置信度 <span className="mono" style={{ color:'var(--foreground)', fontWeight:500 }}>95%</span></span>}
            </div>
            <div style={{ fontSize:14.5, fontWeight:500, lineHeight:1.5 }}>
              {isInvestigating ? 'AI 正在对该事件进行深度调查分析，请稍候…' : report.summary.oneLiner}
            </div>
            {!isInvestigating && (
              <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:4 }}>
                {report.summary.confidenceNote} · 调查耗时 <span className="mono" style={{ color:'var(--foreground)' }}>3.2 分钟</span> · 共 {report.reasoningChain.length} 步推理 · {report.evidenceLocker.length} 条证据
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <UI.Button variant="ghost" size="icon-sm" title="采纳结论"><Icons.ThumbUp size={14}/></UI.Button>
            <UI.Button variant="ghost" size="icon-sm" title="修改结论"><Icons.ThumbDown size={14}/></UI.Button>
            <UI.Button variant="ghost" size="icon-sm" title="评论"><Icons.Message size={14}/></UI.Button>
          </div>
        </div>
      </UI.Card>

      {/* Tabs */}
      <UI.Tabs value={tab} onChange={setTab} items={[
        { value:'ai_analysis', label:'实时AI研判', icon:<Icons.Brain size={13}/> },
        { value:'findings',    label:`关键发现 · ${report.topFindings.length}`, icon:<Icons.Target size={13}/> },
        { value:'evidence',    label:`证据库 · ${report.evidenceLocker.length}`, icon:<Icons.File size={13}/> },
        { value:'reasoning',   label:`推理轨迹 · ${report.reasoningChain.length}`, icon:<Icons.Brain size={13}/> },
        { value:'impact',      label:'影响评估', icon:<Icons.Alert size={13}/> },
        { value:'remediation', label:`处置建议 · ${report.remediationActions.length}`, icon:<Icons.Shield size={13}/> },
      ]} />

      {tab === 'ai_analysis'  && <UI.Card style={{ padding:'20px 24px' }}><AIAnalysisTab event={event} /></UI.Card>}
      {tab === 'findings'    && <FindingsTab event={event} report={report} />}
      {tab === 'evidence'    && <EvidenceTab report={report} />}
      {tab === 'reasoning'   && <ReasoningTab report={report} />}
      {tab === 'impact'      && <ImpactTab event={event} report={report} />}
      {tab === 'remediation' && <RemediationTab report={report} />}
    </div>
  );
}

function FindingsTab({ event, report }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>关键发现摘要</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {report.topFindings.map((f, i) => (
            <div key={f.id} style={{
              display:'flex', alignItems:'flex-start', gap:12,
              padding:'12px 14px', background:'var(--muted-2)',
              border:'1px solid var(--border)', borderRadius:8,
            }}>
              <span style={{
                width:22, height:22, borderRadius:'50%',
                background:'#0a0a0a', color:'#fff', fontSize:11.5, fontWeight:600,
                display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>{i + 1}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, lineHeight:1.55 }}>{f.finding}</div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop:6, paddingLeft:0 }}>
                  <Icons.Link size={12}/> 查看证据 <span className="mono" style={{ color:'var(--foreground)' }}>{f.evidenceRef}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </UI.Card>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <UI.Card style={{ padding:'18px 20px' }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>涉及实体</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {event.entities.map((en, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 10px', background:'var(--muted-2)',
                border:'1px solid var(--border)', borderRadius:6,
              }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:10.5, color:'var(--muted-foreground)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{en.type}</div>
                  <div className="mono" style={{ fontSize:12, marginTop:2, overflow:'hidden', textOverflow:'ellipsis' }}>{en.value}</div>
                </div>
                <UI.Button variant="ghost" size="icon-sm" title="查看实体详情"><Icons.External size={12}/></UI.Button>
              </div>
            ))}
          </div>
        </UI.Card>

        <UI.Card style={{ padding:'18px 20px' }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>知识库引用</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:12.5 }}>
            {[
              { tone:'info',    title:'账号 zhang.san 实体信息', sub:'高价值账号 · 财务部' },
              { tone:'warning', title:'IP 185.220.101.34 历史记录', sub:'Tor 出口节点 · 黑名单' },
              { tone:'neutral', title:'境外登录审批策略', sub:'安全策略' },
            ].map((k, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <UI.Dot tone={k.tone} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:500, fontSize:12.5 }}>{k.title}</div>
                  <div style={{ fontSize:11, color:'var(--muted-foreground)' }}>{k.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </UI.Card>
      </div>
    </div>
  );
}

function EvidenceTab({ report }) {
  const [allOpen, setAllOpen] = useStateDetail(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12.5, color:'var(--muted-foreground)' }}>共 {report.evidenceLocker.length} 条证据 · 按相关性排序</span>
        <UI.Button size="sm" onClick={() => setAllOpen(!allOpen)}>{allOpen ? '全部收起' : '全部展开'}</UI.Button>
      </div>
      {report.evidenceLocker.map(ev => <EvidenceCard key={ev.id} evidence={ev} defaultOpen={allOpen} />)}
    </div>
  );
}

function EvidenceCard({ evidence, defaultOpen }) {
  const [open, setOpen] = useStateDetail(defaultOpen);
  React.useEffect(() => { setOpen(defaultOpen); }, [defaultOpen]);

  const typeLabel = { log:'日志', intel:'情报', context:'上下文', baseline:'基线' }[evidence.type];
  return (
    <UI.Card>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px', background:'transparent', border:0, cursor:'pointer', textAlign:'left',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <UI.Dot tone={evidence.relevance} />
          <UI.Badge variant="muted">{typeLabel}</UI.Badge>
          <span style={{ fontSize:13, fontWeight:500 }}>{evidence.source}</span>
          <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>·</span>
          <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{new Date(evidence.timestamp).toLocaleString('zh-CN')}</span>
          <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>·</span>
          <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{evidence.id}</span>
        </div>
        <Icons.ChevD size={14} style={{ color:'var(--muted-foreground)', transform: open ? 'rotate(180deg)' : 'none', transition:'transform .15s' }} />
      </button>
      {open && (
        <div style={{ padding:'0 16px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>原始数据</div>
            <pre className="mono" style={{
              margin:0, padding:12,
              background:'#0a0a0a', color:'#d4d4d8',
              fontSize:11.5, lineHeight:1.6,
              borderRadius:6, overflow:'auto', maxHeight:200,
            }}>{evidence.content}</pre>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em', display:'inline-flex', alignItems:'center', gap:6 }}>
              <Icons.Brain size={11}/> AI 解读
            </div>
            <div style={{
              padding:12, background:'var(--muted-2)',
              border:'1px solid var(--border)', borderRadius:6,
              fontSize:13, lineHeight:1.55,
            }}>{evidence.interpretation}</div>
          </div>
        </div>
      )}
    </UI.Card>
  );
}

function ReasoningTab({ report }) {
  return (
    <UI.Card style={{ padding:'18px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600 }}>AI 推理轨迹</div>
          <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:2 }}>ReAct 循环 · 阶段一 → 阶段二</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <UI.Badge tone="purple">推理</UI.Badge>
          <UI.Badge variant="solid">行动</UI.Badge>
          <UI.Badge tone="info">观察</UI.Badge>
        </div>
      </div>
      <div style={{ position:'relative', paddingLeft:28 }}>
        <div style={{ position:'absolute', left:14, top:8, bottom:8, width:1, background:'var(--border)' }} />
        {report.reasoningChain.map((step, i) => (
          <ReasoningStep key={step.id} step={step} index={i} last={i === report.reasoningChain.length - 1} />
        ))}
      </div>
    </UI.Card>
  );
}

function ReasoningStep({ step, index, last }) {
  const [open, setOpen] = useStateDetail(false);
  const actionMeta = {
    reason:  { tone:'purple', label:'推理', icon:<Icons.Brain size={11}/> },
    act:     { tone:'neutral', label:'行动', icon:<Icons.Play size={11}/>, solid:true },
    observe: { tone:'info', label:'观察', icon:<Icons.Eye size={11}/> },
  }[step.action];
  const bg = step.action === 'act' ? '#0a0a0a' : UI.tonePalette[actionMeta.tone].fg;

  return (
    <div style={{ position:'relative', paddingBottom: last ? 0 : 16 }}>
      <div style={{
        position:'absolute', left:-28, top:0,
        width:28, height:28, borderRadius:'50%',
        background:'#fff', border:`2px solid ${bg}`, color: bg,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:11, fontWeight:600,
      }}>{index + 1}</div>

      <div onClick={() => setOpen(o => !o)} style={{ cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
          <UI.Badge variant="muted">{step.phase === 'phase1' ? '阶段一' : '阶段二'}</UI.Badge>
          {step.action === 'act'
            ? <UI.Badge variant="solid">{actionMeta.icon} {actionMeta.label}</UI.Badge>
            : <UI.Badge tone={actionMeta.tone}>{actionMeta.icon} {actionMeta.label}</UI.Badge>}
          <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{new Date(step.timestamp).toLocaleTimeString('zh-CN')}</span>
          <Icons.ChevR size={12} style={{ color:'var(--muted-foreground)', transform: open ? 'rotate(90deg)' : 'none', transition:'transform .15s', marginLeft:'auto' }}/>
        </div>
        <div style={{ fontSize:13, color:'var(--foreground)', lineHeight:1.55 }}>{step.reasoning}</div>
      </div>

      {open && (
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
          {step.tool && (
            <div style={{ padding:'8px 12px', background:'var(--muted-2)', border:'1px solid var(--border)', borderRadius:6 }}>
              <div style={{ fontSize:11, color:'var(--muted-foreground)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>调用工具</div>
              <code className="mono" style={{ fontSize:12, color:'#0a0a0a' }}>{step.tool}({step.input ? JSON.stringify(step.input) : ''})</code>
            </div>
          )}
          {step.output && (
            <div style={{ padding:'8px 12px', background:'#0a0a0a', borderRadius:6 }}>
              <div style={{ fontSize:11, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>返回结果</div>
              <pre className="mono" style={{ margin:0, fontSize:11.5, color:'#d4d4d8', lineHeight:1.5, whiteSpace:'pre-wrap' }}>{JSON.stringify(step.output, null, 2)}</pre>
            </div>
          )}
          {step.findings && step.findings.length > 0 && (
            <div style={{ padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:6 }}>
              <div style={{ fontSize:11, color:'#15803d', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4, fontWeight:500 }}>关键发现</div>
              {step.findings.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:6, fontSize:12.5 }}>
                  <Icons.Check size={13} style={{ color:'#15803d', marginTop:2 }}/>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ImpactTab({ event, report }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:12, display:'inline-flex', alignItems:'center', gap:8 }}>
          <Icons.Key size={15}/> 受影响账号 ({report.impactAssessment.affectedAccounts.length})
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {report.impactAssessment.affectedAccounts.map((a, i) => (
            <div key={i} className="mono" style={{ padding:'8px 10px', fontSize:12.5, background:'var(--muted-2)', borderRadius:6, border:'1px solid var(--border)' }}>{a}</div>
          ))}
        </div>
      </UI.Card>

      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:12, display:'inline-flex', alignItems:'center', gap:8 }}>
          <Icons.Monitor size={15}/> 受影响设备 ({report.impactAssessment.affectedDevices.length})
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {report.impactAssessment.affectedDevices.map((d, i) => (
            <div key={i} className="mono" style={{ padding:'8px 10px', fontSize:12.5, background:'var(--muted-2)', borderRadius:6, border:'1px solid var(--border)' }}>{d}</div>
          ))}
        </div>
      </UI.Card>

      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:12, display:'inline-flex', alignItems:'center', gap:8 }}>
          <Icons.Cloud size={15}/> 受影响系统 ({report.impactAssessment.affectedSystems.length})
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {report.impactAssessment.affectedSystems.map((s, i) => (
            <UI.Badge key={i} variant="muted">{s}</UI.Badge>
          ))}
        </div>
      </UI.Card>

      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:12, display:'inline-flex', alignItems:'center', gap:8 }}>
          <Icons.Target size={15}/> 攻击阶段评估
        </div>
        <div style={{ fontSize:13.5, lineHeight:1.6 }}>{report.impactAssessment.attackStage}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:14 }}>
          {['初始访问','立足','持久化','凭证窃取','横向移动','数据收集','数据外泄'].map((stage, i) => {
            const done = i <= 2;
            const current = i === 2;
            return (
              <React.Fragment key={i}>
                <div style={{
                  padding:'4px 8px', fontSize:11, borderRadius:4,
                  background: current ? '#fef2f2' : done ? '#0a0a0a' : 'var(--muted)',
                  color: current ? '#b91c1c' : done ? '#fff' : 'var(--muted-foreground)',
                  border: current ? '1px solid #fecaca' : 'none',
                  fontWeight: current ? 600 : 400,
                }}>{stage}</div>
                {i < 6 && <Icons.ChevR size={10} style={{ color:'var(--muted-foreground)' }}/>}
              </React.Fragment>
            );
          })}
        </div>
      </UI.Card>
    </div>
  );
}

function RemediationTab({ report }) {
  const groups = [
    { level:'immediate',  title:'立即执行', sub:'0 – 30 分钟', tone:'critical', icon:<Icons.Zap size={14}/> },
    { level:'short_term', title:'短期执行', sub:'30 分钟 – 24 小时', tone:'high', icon:<Icons.Clock size={14}/> },
    { level:'long_term',  title:'长期建议', sub:'策略调整', tone:'neutral', icon:<Icons.Target size={14}/> },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {groups.map(g => {
        const actions = report.remediationActions.filter(a => a.level === g.level);
        return (
          <div key={g.level}>
            <div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                <span style={{
                  width:24, height:24, borderRadius:6,
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  background: UI.tonePalette[g.tone].bg, color: UI.tonePalette[g.tone].fg,
                  border: `1px solid ${UI.tonePalette[g.tone].bd}`,
                }}>{g.icon}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{g.title}</div>
                  <div style={{ fontSize:11, color:'var(--muted-foreground)' }}>{g.sub}</div>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {actions.map(a => <RemediationRow key={a.id} action={a} tone={g.tone} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RemediationRow({ action, tone }) {
  return (
    <UI.Card style={{ padding:'14px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <UI.Badge tone={tone}>{tone === 'critical' ? '立即' : tone === 'high' ? '短期' : '长期'}</UI.Badge>
        <span style={{ fontSize:13.5, fontWeight:500 }}>{action.title}</span>
      </div>
      <div style={{ fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.55 }}>{action.description}</div>
      <div style={{ marginTop:10 }}>
        <UI.Badge variant="muted">待执行</UI.Badge>
      </div>
    </UI.Card>
  );
}


/* Action Graph — 处置流程可视化
   Two views:
   1) overview — 7-column columnar DAG (existing)
   2) threads  — parallel investigation threads, 每行一条调查思路 */

const { useState: useStateAg } = React;

function ActionGraphPage({ eventId, onNavigate }) {
  const event = mockEvents.find(e => e.id === eventId) || mockEvents[0];
  const report = mockReport;
  const [view, setView] = useStateAg('threads');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <button onClick={() => onNavigate('events/' + eventId)} className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start', paddingLeft:0 }}>
        <Icons.Back size={14}/> 返回事件详情
      </button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <UI.Badge variant="solid"><Icons.Brain size={11}/> 处置流程可视化</UI.Badge>
            <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>{event.id}</span>
          </div>
          <h1 style={{ fontSize:22, fontWeight:600, margin:0, letterSpacing:'-0.01em' }}>调查路径全景</h1>
          <div style={{ fontSize:13, color:'var(--muted-foreground)', marginTop:4, lineHeight:1.55 }}>
            {event.title}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <UI.Tabs value={view} onChange={setView} size="sm" items={[
            { value:'threads',  label:'调查线程图', icon:<Icons.Activity size={13}/> },
            { value:'overview', label:'流程总览',   icon:<Icons.Network size={13}/> },
          ]}/>
          <UI.Button leftIcon={<Icons.Download size={13}/>}>导出 SVG</UI.Button>
          <UI.Button leftIcon={<Icons.Share size={13}/>}>分享</UI.Button>
        </div>
      </div>

      {view === 'overview' && <OverviewGraph event={event} report={report} />}
      {view === 'threads'  && <ThreadsGraph  event={event} report={report} />}
    </div>
  );
}

/* ============================================================
   View 1: Overview (original columnar DAG)
   ============================================================ */
function OverviewGraph({ event, report }) {
  const phase1Steps = report.reasoningChain.filter(s => s.phase === 'phase1');
  const phase2Steps = report.reasoningChain.filter(s => s.phase === 'phase2');
  const immediate = report.remediationActions.filter(a => a.level === 'immediate');

  const COL_W = 220, NODE_H = 70, ROW_GAP = 14, PAD_LEFT = 40, PAD_TOP = 60;

  const cols = [
    [{ id:'alert', kind:'alert', title:'告警接入', sub:event.sourceSystem, badge:'输入' }],
    phase1Steps.filter(s => s.action !== 'observe').map(s => ({
      id: s.id, kind:`step-${s.action}`, title: stepTitle(s), sub: s.tool || `阶段一 · ${stepActionLabel(s.action)}`,
      badge: stepActionLabel(s.action),
    })),
    phase1Steps.filter(s => s.action === 'observe' && s.findings).flatMap(s => s.findings.map((f, fi) => ({
      id: `${s.id}-f${fi}`, kind:'finding', title:f, sub:'阶段一发现', badge:'发现',
    }))),
    phase2Steps.filter(s => s.action !== 'observe').map(s => ({
      id: s.id, kind:`step-${s.action}`, title: stepTitle(s), sub: s.tool || `阶段二 · ${stepActionLabel(s.action)}`,
      badge: stepActionLabel(s.action),
    })),
    [
      ...phase2Steps.filter(s => s.findings).flatMap(s => s.findings.map((f, fi) => ({
        id: `${s.id}-f${fi}`, kind:'finding', title:f, sub:'阶段二发现', badge:'发现',
      }))),
      { id:'impact', kind:'impact', title:'影响评估', sub:`${report.impactAssessment.affectedAccounts.length} 账号 · ${report.impactAssessment.affectedDevices.length} 设备`, badge:'评估' },
    ],
    [{ id:'conclusion', kind:'conclusion', title:'确认威胁', sub:'置信度 95%', badge:'结论' }],
    immediate.map(a => ({ id:a.id, kind:'remediation', title:a.title, sub:a.description, badge:'立即' })),
  ];

  const nodes = [];
  const colHeights = cols.map(c => c.length * NODE_H + (c.length - 1) * ROW_GAP);
  const maxColH = Math.max(...colHeights);
  cols.forEach((col, ci) => {
    const colY0 = PAD_TOP + (maxColH - colHeights[ci]) / 2;
    col.forEach((n, ri) => {
      nodes.push({ ...n, col:ci, x: PAD_LEFT + ci * COL_W, y: colY0 + ri * (NODE_H + ROW_GAP) });
    });
  });

  const edges = [];
  for (let ci = 0; ci < cols.length - 1; ci++) {
    const left = nodes.filter(n => n.col === ci);
    const right = nodes.filter(n => n.col === ci + 1);
    if (left.length === right.length && left.length > 1) {
      left.forEach((l, i) => edges.push({ from:l, to:right[i] }));
    } else {
      left.forEach(l => right.forEach(r => edges.push({ from:l, to:r })));
    }
  }

  const svgW = PAD_LEFT * 2 + cols.length * COL_W;
  const svgH = PAD_TOP * 2 + maxColH;
  const [activeNode, setActiveNode] = useStateAg(null);

  return (
    <>
      <div style={{ display:'flex', flexWrap:'wrap', gap:14, fontSize:12, color:'var(--muted-foreground)', padding:'4px 0' }}>
        <Legend dot="#0a0a0a" label="输入"/>
        <Legend dot="#a78bfa" label="推理 (reason)"/>
        <Legend dot="#0a0a0a" outline label="行动 (act)"/>
        <Legend dot="#3b82f6" label="观察 (observe)"/>
        <Legend dot="#22c55e" label="发现"/>
        <Legend dot="#ea580c" label="影响 / 评估"/>
        <Legend dot="#dc2626" label="结论 / 立即处置"/>
      </div>

      <UI.Card style={{ padding:0, overflow:'auto' }}>
        <div style={{ position:'relative', width: svgW, height: svgH, background:'#fff',
          backgroundImage:'radial-gradient(circle, #f4f4f5 1px, transparent 1px)',
          backgroundSize:'24px 24px', backgroundPosition:'8px 8px',
        }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#71717a"/>
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e"/>
              </marker>
            </defs>
            {['告警', '阶段一 · 推理 + 行动', '关键发现', '阶段二 · 推理 + 行动', '影响评估', '结论', '立即处置'].map((title, i) => (
              <text key={i} x={PAD_LEFT + i * COL_W + 90} y={32} textAnchor="middle"
                fontSize="11" fill="#71717a" fontWeight="500" fontFamily="Inter">{title}</text>
            ))}
            {edges.map((e, i) => {
              const x1 = e.from.x + 180;
              const y1 = e.from.y + NODE_H / 2;
              const x2 = e.to.x;
              const y2 = e.to.y + NODE_H / 2;
              const midX = (x1 + x2) / 2;
              const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
              const isActive = activeNode && (activeNode === e.from.id || activeNode === e.to.id);
              return (
                <path key={i} d={path} fill="none"
                  stroke={isActive ? '#22c55e' : '#d4d4d8'}
                  strokeWidth={isActive ? 1.8 : 1.2}
                  strokeDasharray={isActive ? 'none' : '3 3'}
                  markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                />
              );
            })}
          </svg>
          {nodes.map(n => (
            <GraphNode key={n.id} node={n} active={activeNode === n.id}
              onHover={() => setActiveNode(n.id)} onLeave={() => setActiveNode(null)} />
          ))}
        </div>
      </UI.Card>
    </>
  );
}

function GraphNode({ node, active, onHover, onLeave }) {
  const meta = nodeStyle(node.kind);
  return (
    <div onMouseEnter={onHover} onMouseLeave={onLeave} style={{
      position:'absolute', left:node.x, top:node.y, width:180, height:70,
      background:'#fff', border:`1.5px solid ${active ? '#22c55e' : meta.border}`,
      borderLeft:`3px solid ${meta.accent}`, borderRadius:8, padding:'10px 12px',
      boxShadow: active ? '0 4px 12px -2px rgba(34, 197, 94, 0.25)' : 'var(--shadow-sm)',
      display:'flex', flexDirection:'column', gap:4,
      transition:'box-shadow .15s, border-color .15s', cursor:'pointer',
      zIndex: active ? 2 : 1,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{
          fontSize:9.5, padding:'1px 5px', borderRadius:3, fontWeight:500,
          background: meta.badgeBg, color: meta.badgeFg, lineHeight:1.3,
        }}>{node.badge}</span>
      </div>
      <div style={{
        fontSize:12, fontWeight:500, lineHeight:1.35,
        overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
      }}>{node.title}</div>
      <div className={node.sub && node.sub.includes('_') ? 'mono' : ''} style={{
        fontSize:10.5, color:'var(--muted-foreground)',
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>{node.sub}</div>
    </div>
  );
}

function nodeStyle(kind) {
  switch (kind) {
    case 'alert':       return { accent:'#0a0a0a', border:'#e4e4e7', badgeBg:'#0a0a0a',   badgeFg:'#fff' };
    case 'step-reason': return { accent:'#a78bfa', border:'#e4e4e7', badgeBg:'#f5f3ff', badgeFg:'#6d28d9' };
    case 'step-act':    return { accent:'#0a0a0a', border:'#e4e4e7', badgeBg:'#27272a', badgeFg:'#fff' };
    case 'step-observe':return { accent:'#3b82f6', border:'#e4e4e7', badgeBg:'#eff6ff', badgeFg:'#1d4ed8' };
    case 'finding':     return { accent:'#22c55e', border:'#e4e4e7', badgeBg:'#f0fdf4', badgeFg:'#15803d' };
    case 'impact':      return { accent:'#ea580c', border:'#e4e4e7', badgeBg:'#fff7ed', badgeFg:'#c2410c' };
    case 'conclusion':  return { accent:'#dc2626', border:'#fecaca', badgeBg:'#fef2f2', badgeFg:'#b91c1c' };
    case 'remediation': return { accent:'#dc2626', border:'#fecaca', badgeBg:'#fef2f2', badgeFg:'#b91c1c' };
    default:            return { accent:'#71717a', border:'#e4e4e7', badgeBg:'#f4f4f5', badgeFg:'#52525b' };
  }
}

function stepActionLabel(a) { return a === 'reason' ? '推理' : a === 'act' ? '行动' : '观察'; }
function stepTitle(s) {
  if (s.action === 'reason') return s.reasoning.length > 40 ? s.reasoning.slice(0, 40) + '…' : s.reasoning;
  if (s.action === 'act') return s.tool || s.reasoning;
  return s.reasoning;
}

function Legend({ dot, outline, label }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
      <span style={{
        width:10, height:10, borderRadius:2,
        background: outline ? '#fff' : dot,
        border: outline ? `1.5px solid ${dot}` : 'none',
      }}/>
      {label}
    </span>
  );
}

/* ============================================================
   View 2: Investigation Threads (parallel rows)
   Each row = one inquiry chain. Cells: search → evidences → analyze → maybe report
   ============================================================ */

// Source / evidence type catalog (icon + tint)
const SRC_CATALOG = {
  blocklist:    { iconKey:'Globe',    fg:'#0891b2', bg:'#ecfeff', name:'Blocklist.de IP' },
  threat_intel: { iconKey:'Shield',   fg:'#0d9488', bg:'#f0fdfa', name:'Custom Threat Intel' },
  dns:          { iconKey:'Server',   fg:'#0d9488', bg:'#f0fdfa', name:'DNSResolver' },
  impersonation:{ iconKey:'Fish',     fg:'#7c3aed', bg:'#f5f3ff', name:'域名仿冒检测' },
  whois:        { iconKey:'File',     fg:'#ea580c', bg:'#fff7ed', name:'WHOIS' },
  ad:           { iconKey:'Key',      fg:'#0d9488', bg:'#f0fdfa', name:'Azure AD' },
  exchange:     { iconKey:'Mail',     fg:'#ea580c', bg:'#fff7ed', name:'Exchange Online' },
  edr:          { iconKey:'Monitor',  fg:'#7c3aed', bg:'#f5f3ff', name:'CrowdStrike EDR' },
  proofpoint:   { iconKey:'Eye',      fg:'#0891b2', bg:'#ecfeff', name:'Proofpoint Click' },
  kb:           { iconKey:'Database', fg:'#16a34a', bg:'#f0fdf4', name:'知识库' },
  baseline:     { iconKey:'Activity', fg:'#7c3aed', bg:'#f5f3ff', name:'行为基线' },
  geoip:        { iconKey:'Globe',    fg:'#0891b2', bg:'#ecfeff', name:'GeoIP 库' },
};

// Threads — synthesized from event report
const THREADS = [
  { id:'th1', inquiry:'查询域名 micros0ft-support.com 的威胁情报信誉',
    sources:[
      { key:'blocklist',    queries:2, status:'ok' },
      { key:'threat_intel', queries:3, status:'found' },
      { key:'dns',          queries:1, status:'ok' },
      { key:'impersonation',queries:1, status:'found' },
      { key:'whois',        queries:1, status:'found' },
    ],
    verdict:'malicious', conclusion:'确认为新注册的品牌仿冒钓鱼域名，注册时间 48 小时' },
  { id:'th2', inquiry:'查询用户 zhang.san 邮件点击与表单提交记录',
    sources:[
      { key:'proofpoint', queries:2, status:'found' },
      { key:'kb',         queries:1, status:'ok' },
      { key:'baseline',   queries:1, status:'ok' },
      { key:'edr',        queries:1, status:'ok' },
      { key:'whois',      queries:1, status:'ok' },
    ],
    verdict:'malicious', conclusion:'用户已在钓鱼页提交用户名/密码，凭据泄露' },
  { id:'th3', inquiry:'查询 zhang.san 近 24 小时 Azure AD 登录历史',
    sources:[
      { key:'ad',     queries:3, status:'found' },
      { key:'geoip',  queries:1, status:'found' },
      { key:'baseline', queries:1, status:'ok' },
      { key:'kb',     queries:1, status:'ok' },
    ],
    verdict:'malicious', conclusion:'发现来自荷兰 Tor 节点的成功登录，Impossible Travel' },
  { id:'th4', inquiry:'查询用户邮箱是否被设置可疑转发规则',
    sources:[
      { key:'exchange', queries:2, status:'found' },
      { key:'kb',       queries:1, status:'ok' },
      { key:'baseline', queries:1, status:'ok' },
      { key:'whois',    queries:1, status:'ok' },
    ],
    verdict:'malicious', conclusion:'发现规则名为 "." 的隐蔽转发，目标为外部邮箱' },
  { id:'th5', inquiry:'查询 SharePoint / OneDrive 是否有异常文件访问',
    sources:[
      { key:'ad',       queries:2, status:'ok' },
      { key:'exchange', queries:1, status:'ok' },
      { key:'baseline', queries:1, status:'ok' },
      { key:'kb',       queries:1, status:'ok' },
    ],
    verdict:'clean', conclusion:'未发现异常文件访问行为' },
  { id:'th6', inquiry:'对比 zhang.san 行为基线 — 是否首次境外登录',
    sources:[
      { key:'baseline', queries:2, status:'found' },
      { key:'kb',       queries:1, status:'found' },
    ],
    verdict:'malicious', conclusion:'账号历史从未境外登录，本次为首次异常' },
  { id:'th7', inquiry:'查询 IP 185.220.101.34 历史攻击记录',
    sources:[
      { key:'threat_intel', queries:1, status:'found' },
      { key:'blocklist',    queries:2, status:'found' },
    ],
    verdict:'malicious', conclusion:'IP 已在历史调查中标记为 Tor 出口节点 + 永久黑名单' },
  { id:'th8', inquiry:'检索企业内是否有相同钓鱼模板的其他受害者',
    sources:[
      { key:'proofpoint', queries:1, status:'ok' },
    ],
    verdict:'clean', conclusion:'当前仅 zhang.san 一例命中' },
  { id:'th9', inquiry:'核对账号权限与可访问的敏感系统范围',
    sources:[
      { key:'ad', queries:1, status:'ok' },
    ],
    verdict:'info', conclusion:'账号属财务部 VIP，可访问 SAP / 报销 / OA 财务模块' },
];

function ThreadsGraph({ event, report }) {
  const totalEvidence = THREADS.reduce((s, t) => s + t.sources.reduce((a, b) => a + b.queries, 0), 0);
  const uniqueSources = new Set(THREADS.flatMap(t => t.sources.map(s => s.key))).size;
  const stats = [
    { label:'调查总用时',   value:'9m',  unit:'',    tone:'success' },
    { label:'调查线程',     value:THREADS.length, unit:'', tone:'purple' },
    { label:'证据数量',     value:totalEvidence,  unit:'', tone:'warning' },
    { label:'调用数据源',   value:uniqueSources,  unit:'', tone:'info' },
    { label:'提取实体',     value:event.entities.length, unit:'', tone:'critical' },
    { label:'已就绪处置',   value:report.remediationActions.filter(a => a.level === 'immediate').length, unit:'', tone:'success' },
  ];

  // unified grid: 56 | 64 | 56 | 1fr | 56 | 64
  const gridCols = '56px 64px 56px minmax(360px, 1fr) 56px 64px';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:14, alignItems:'flex-start' }}>
      {/* Main canvas */}
      <UI.Card style={{ padding:0, overflow:'hidden' }}>
        {/* Column headers */}
        <div style={{
          display:'grid', gridTemplateColumns: gridCols,
          gap:18, padding:'14px 20px',
          background:'var(--muted-2)', borderBottom:'1px solid var(--border)',
        }}>
          <ColHead label="告警" />
          <ColHead label="Understand & Strategize" multi />
          <ColHead label="Collect Evidence" span={2} multi />
          <span></span>
          <ColHead label="Analyze" multi />
          <ColHead label="Report & Respond" multi />
        </div>

        {/* Body: a single grid that holds shared cells (rowSpan) + per-row cells */}
        <div style={{ padding:'20px', overflowX:'auto' }}>
          <div style={{
            display:'grid', gridTemplateColumns: gridCols,
            columnGap:18, rowGap:14,
            position:'relative',
          }}>
            {/* Alert tile — spans all rows */}
            <div style={{
              gridColumn:'1', gridRow:`1 / span ${THREADS.length}`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <CellTile tone="critical" iconKey="Alert" hint="原始告警" />
            </div>
            {/* Brain tile — spans all rows */}
            <div style={{
              gridColumn:'2', gridRow:`1 / span ${THREADS.length}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative',
            }}>
              <CellTile tone="purple" iconKey="Brain" hint="阶段一：理解 & 规划" emphasis />
              {/* Vertical fan-out line on right edge of brain column */}
              <div style={{
                position:'absolute', right:-9, top:18, bottom:18, width:1,
                background:'#e4e4e7',
              }}/>
            </div>

            {/* Connector lines (alert→brain) drawn via simple borders, and brain→search via row connectors */}

            {/* Rows */}
            {THREADS.map((t, idx) => (
              <ThreadRowCells key={t.id} thread={t} index={idx} totalRows={THREADS.length} />
            ))}
          </div>
        </div>
      </UI.Card>

      {/* Right stat sidebar */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {stats.map((s, i) => (
          <UI.Card key={i} style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.02em', color: UI.tonePalette[s.tone].fg }}>{s.value}</span>
              {s.unit && <span style={{ fontSize:13, color:'var(--muted-foreground)' }}>{s.unit}</span>}
            </div>
            <div style={{ fontSize:11.5, color:'var(--muted-foreground)', marginTop:2 }}>{s.label}</div>
          </UI.Card>
        ))}
        {/* Minimap */}
        <UI.Card style={{ padding:'10px 12px' }}>
          <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:6 }}>线程缩略图</div>
          <Minimap threads={THREADS}/>
        </UI.Card>
      </div>
    </div>
  );
}

function ColHead({ label, multi }) {
  return (
    <div style={{
      fontSize: multi ? 10.5 : 11,
      fontWeight:600, color:'var(--muted-foreground)',
      textTransform:'uppercase', letterSpacing:'0.04em',
      textAlign:'center', padding:'4px 4px', lineHeight:1.3,
    }}>{label}</div>
  );
}

function ThreadRowCells({ thread, index, totalRows }) {
  const [popup, setPopup] = useStateAg(null);
  const showsReport = thread.verdict === 'malicious' && index === 0;
  const verdictTone = thread.verdict === 'malicious' ? 'critical' : thread.verdict === 'clean' ? 'success' : 'info';
  const verdictIcon = thread.verdict === 'malicious' ? 'Alert' : thread.verdict === 'clean' ? 'Check' : 'Eye';

  // Each row places into cols 3,4,5,6 (search, evidence, analyze, report)
  return (
    <>
      {/* Col 3 - Search tile */}
      <div style={{ gridColumn:'3', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', minHeight:48 }}>
        {/* Connector from brain rail to search */}
        <span style={{
          position:'absolute', left:-18, top:'50%', width:18, height:1,
          background:'#d4d4d8',
        }}/>
        <CellTile
          tone="info" iconKey="Search" hint={`线索 ${index + 1}`}
          active={popup === 'search'}
          onClick={() => setPopup(popup === 'search' ? null : 'search')}
        />
        {popup === 'search' && (
          <ThreadPopover anchor="search" onClose={() => setPopup(null)}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              调查线索 <UI.Badge variant="muted"><Icons.Zap size={10}/> 1 Action</UI.Badge>
            </div>
            <div style={{
              padding:'10px 12px', background:'var(--muted-2)', borderRadius:6,
              border:'1px solid var(--border)', display:'flex', gap:8, alignItems:'flex-start',
            }}>
              <UI.Dot tone="success" style={{ marginTop:4 }}/>
              <div>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>已生成的问题</div>
                <div style={{ fontSize:12.5, color:'var(--foreground)' }}>{thread.inquiry}</div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-ghost btn-sm" style={{ color:'var(--info)' }}>更多详情 <Icons.ArrowR size={10}/></button>
            </div>
          </ThreadPopover>
        )}
      </div>

      {/* Col 4 - Evidence */}
      <div style={{ gridColumn:'4', position:'relative', display:'flex', alignItems:'center', minHeight:48 }}>
        {/* Connector left */}
        <span style={{ position:'absolute', left:-9, top:'50%', width:9, height:1, background:'#d4d4d8' }}/>
        <div
          onClick={() => setPopup(popup === 'evidence' ? null : 'evidence')}
          style={{
            display:'inline-flex', alignItems:'center', gap:4, padding:'5px 6px',
            background:'#fff', border:`1.5px solid ${popup === 'evidence' ? '#22c55e' : 'var(--border)'}`,
            borderRadius:8, cursor:'pointer',
            boxShadow: popup === 'evidence' ? '0 4px 12px -2px rgba(34,197,94,0.25)' : 'var(--shadow-xs)',
            transition:'border-color .15s, box-shadow .15s',
          }}
        >
          {thread.sources.map((s, si) => {
            const cfg = SRC_CATALOG[s.key];
            const Icon = Icons[cfg.iconKey];
            return (
              <div key={si} title={cfg.name} style={{
                width:34, height:34, borderRadius:6,
                background:cfg.bg, color:cfg.fg, border:`1px solid ${cfg.fg}33`,
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative',
              }}>
                <Icon size={16}/>
                {s.status === 'found' && (
                  <span style={{
                    position:'absolute', top:-3, right:-3, width:8, height:8,
                    borderRadius:'50%', background:'#22c55e', border:'1.5px solid #fff',
                  }}/>
                )}
              </div>
            );
          })}
        </div>
        {/* Connector right */}
        <span style={{ position:'absolute', right:-9, top:'50%', width:9, height:1, background:'#d4d4d8' }}/>
        {popup === 'evidence' && (
          <ThreadPopover anchor="evidence" onClose={() => setPopup(null)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>数据收集</span>
              <UI.Badge variant="muted"><Icons.Zap size={10}/> {thread.sources.reduce((a, b) => a + b.queries, 0)} 次调用</UI.Badge>
            </div>
            <div style={{
              padding:'10px 12px', background:'var(--muted-2)', borderRadius:6,
              border:'1px solid var(--border)', display:'flex', gap:8, alignItems:'flex-start', marginBottom:10,
            }}>
              <UI.Dot tone="success" style={{ marginTop:4 }}/>
              <div>
                <div style={{ fontSize:11.5, color:'var(--muted-foreground)', marginBottom:2 }}>1 条调查思路</div>
                <div style={{ fontSize:12.5 }}>{thread.inquiry}</div>
              </div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:'var(--muted-foreground)' }}>
                  <th style={{ textAlign:'left', padding:'6px 0', fontWeight:500, fontSize:11 }}>数据源</th>
                  <th style={{ textAlign:'right', padding:'6px 0', fontWeight:500, fontSize:11 }}>查询次数</th>
                  <th style={{ textAlign:'right', padding:'6px 0', fontWeight:500, fontSize:11 }}>结果</th>
                </tr>
              </thead>
              <tbody>
                {thread.sources.map((s, i) => {
                  const cfg = SRC_CATALOG[s.key];
                  const Icon = Icons[cfg.iconKey];
                  return (
                    <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                      <td style={{ padding:'8px 0' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                          <span style={{
                            width:22, height:22, borderRadius:5, background:cfg.bg, color:cfg.fg,
                            display:'inline-flex', alignItems:'center', justifyContent:'center',
                          }}><Icon size={12}/></span>
                          {cfg.name}
                        </span>
                      </td>
                      <td className="mono" style={{ textAlign:'right', padding:'8px 0' }}>{s.queries}</td>
                      <td style={{ textAlign:'right', padding:'8px 0' }}>
                        <UI.Dot tone={s.status === 'found' ? 'success' : 'neutral'} size={8} style={{ display:'inline-block' }}/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-ghost btn-sm" style={{ color:'var(--info)' }}>更多详情 <Icons.ArrowR size={10}/></button>
            </div>
          </ThreadPopover>
        )}
      </div>

      {/* Col 5 - Analyze */}
      <div style={{ gridColumn:'5', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', minHeight:48 }}>
        <CellTile
          tone={verdictTone}
          iconKey={verdictIcon}
          hint={thread.verdict === 'malicious' ? '威胁' : thread.verdict === 'clean' ? '无异常' : '信息'}
          active={popup === 'analyze'}
          onClick={() => setPopup(popup === 'analyze' ? null : 'analyze')}
        />
        {showsReport && (
          <span style={{ position:'absolute', right:-9, top:'50%', width:9, height:1, background:'#d4d4d8' }}/>
        )}
        {popup === 'analyze' && (
          <ThreadPopover anchor="analyze" onClose={() => setPopup(null)}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>分析结论</div>
            <div style={{
              padding:'10px 12px', borderRadius:6,
              background: UI.tonePalette[verdictTone].bg,
              border:`1px solid ${UI.tonePalette[verdictTone].bd}`,
              display:'flex', gap:8, alignItems:'flex-start',
            }}>
              <UI.Dot tone={verdictTone} style={{ marginTop:4 }}/>
              <div>
                <div style={{ fontSize:11.5, color: UI.tonePalette[verdictTone].fg, fontWeight:500, marginBottom:2 }}>
                  {thread.verdict === 'malicious' ? '确认威胁' : thread.verdict === 'clean' ? '无异常' : '辅助信息'}
                </div>
                <div style={{ fontSize:12.5 }}>{thread.conclusion}</div>
              </div>
            </div>
          </ThreadPopover>
        )}
      </div>

      {/* Col 6 - Report (only on first malicious row) */}
      <div style={{ gridColumn:'6', display:'flex', alignItems:'center', justifyContent:'center', minHeight:48 }}>
        {showsReport && <CellTile tone="warning" iconKey="File" hint="最终结论" emphasis/>}
      </div>
    </>
  );
}

function CellTile({ tone='neutral', iconKey, hint, active, onClick, emphasis }) {
  const Icon = Icons[iconKey];
  const pal = UI.tonePalette[tone] || UI.tonePalette.neutral;
  return (
    <button onClick={onClick} title={hint} style={{
      width:44, height:44, borderRadius:8,
      background:'#fff', border:`1.5px solid ${active ? '#22c55e' : pal.bd}`,
      color: pal.fg, display:'flex', alignItems:'center', justifyContent:'center',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: emphasis ? `0 4px 12px -2px ${pal.fg}33, var(--shadow-sm)` : active ? `0 4px 12px -2px ${pal.fg}33` : 'var(--shadow-xs)',
      transition:'border-color .15s, box-shadow .15s, transform .15s',
      padding:0, fontFamily:'inherit',
    }}>
      <Icon size={18}/>
    </button>
  );
}

function ThreadPopover({ children, anchor, onClose }) {
  return (
    <div style={{
      position:'absolute',
      left: anchor === 'evidence' ? '50%' : anchor === 'search' ? 56 : 56,
      top: anchor === 'evidence' ? 56 : 56,
      transform: anchor === 'evidence' ? 'translateX(-50%)' : 'none',
      minWidth: anchor === 'evidence' ? 380 : 280,
      background:'#fff', border:'1px solid var(--border)', borderRadius:10,
      padding:14, boxShadow:'var(--shadow-pop)', zIndex:20,
      animation:'popIn .15s ease-out',
    }}>
      <button onClick={onClose} style={{
        position:'absolute', top:8, right:8,
        width:22, height:22, borderRadius:4, border:0,
        background:'transparent', color:'var(--muted-foreground)', cursor:'pointer',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
      }}><Icons.Close size={12}/></button>
      {children}
    </div>
  );
}

function Minimap({ threads }) {
  return (
    <svg viewBox="0 0 100 120" width="100%" style={{ display:'block' }}>
      <line x1="20" y1="6" x2="20" y2="112" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="2 2"/>
      <line x1="50" y1="6" x2="50" y2="112" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="2 2"/>
      <line x1="78" y1="6" x2="78" y2="112" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="2 2"/>
      {threads.map((t, i) => {
        const y = 10 + i * 10.5;
        const tone = t.verdict === 'malicious' ? '#dc2626' : t.verdict === 'clean' ? '#22c55e' : '#3b82f6';
        return (
          <g key={t.id}>
            <rect x="16" y={y - 3} width="8" height="6" rx="1" fill="#a78bfa" opacity="0.7"/>
            <rect x="46" y={y - 3} width="8" height="6" rx="1" fill="#0891b2" opacity="0.7"/>
            <rect x="74" y={y - 3} width="8" height="6" rx="1" fill={tone}/>
          </g>
        );
      })}
    </svg>
  );
}


/* Hunting page — 主动狩猎 */

const { useState: useStateHunt } = React;

function HuntingPage({ onNavigate }) {
  const [tab, setTab] = useStateHunt('tasks');
  const [statusFilter, setStatusFilter] = useStateHunt('all');
  const [modeFilter, setModeFilter] = useStateHunt('all');
  const [search, setSearch] = useStateHunt('');
  const [newOpen, setNewOpen] = useStateHunt(false);

  const filtered = mockHuntTasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (modeFilter !== 'all' && t.mode !== modeFilter) return false;
    if (search && !(`${t.name} ${t.hypothesis || ''}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const running = mockHuntTasks.filter(t => t.status === 'running').length;
  const completed = mockHuntTasks.filter(t => t.status === 'completed').length;
  const findings = mockHuntTasks.reduce((a, t) => a + t.findings.length, 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <UI.SectionTitle
        title="主动狩猎"
        subtitle="主动搜索潜在威胁，发现绕过告警规则的隐蔽攻击"
        action={
          <UI.Button variant="primary" leftIcon={<Icons.Plus size={14}/>} onClick={() => setNewOpen(true)}>
            新建狩猎任务
          </UI.Button>
        }
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        <UI.StatCard label="执行中任务" value={running} icon={<Icons.Loader size={15} className="spin"/>} />
        <UI.StatCard label="已完成任务" value={completed} icon={<Icons.Check size={15}/>}/>
        <UI.StatCard label="可疑发现" value={findings} sub="待人工复核" icon={<Icons.Alert size={15}/>} />
        <UI.StatCard label="假设库" value={huntPacks.length} sub="预置狩猎包" icon={<Icons.File size={15}/>} />
      </div>

      <UI.Tabs value={tab} onChange={setTab} items={[
        { value:'tasks', label:'狩猎任务', icon:<Icons.Target size={13}/> },
        { value:'packs', label:'狩猎假设库', icon:<Icons.Zap size={13}/> },
      ]} />

      {tab === 'tasks' && (
        <>
          <UI.Card style={{ padding:'10px 12px' }}>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:'1 1 240px' }}>
                <UI.Input
                  placeholder="搜索任务名称或假设…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  leftIcon={<Icons.Search size={14}/>}
                />
              </div>
              <UI.Select value={statusFilter} onChange={setStatusFilter} options={[
                { value:'all', label:'全部状态' },
                { value:'running', label:'执行中' },
                { value:'completed', label:'已完成' },
                { value:'pending', label:'等待中' },
                { value:'failed', label:'失败' },
              ]} width={130} />
              <UI.Select value={modeFilter} onChange={setModeFilter} options={[
                { value:'all', label:'全部模式' },
                { value:'auto', label:'自动狩猎' },
                { value:'manual', label:'手动狩猎' },
              ]} width={130} />
              <div style={{ flex:1 }}/>
              <UI.Button leftIcon={<Icons.Refresh size={14}/>}>刷新</UI.Button>
            </div>
          </UI.Card>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
            {filtered.map(t => <HuntTaskCard key={t.id} task={t} />)}
          </div>
        </>
      )}

      {tab === 'packs' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
          {huntPacks.map(p => (
            <UI.Card key={p.id} style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ fontSize:13.5, fontWeight:600 }}>{p.name}</div>
                <UI.Badge variant="muted">{p.frequency}</UI.Badge>
              </div>
              <div style={{ fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.55, flex:1 }}>{p.description}</div>
              <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'space-between' }}>
                <UI.Badge tone="info">{SCENE_CONFIG[p.scene].label}</UI.Badge>
                <UI.Button size="sm" leftIcon={<Icons.Play size={12}/>}>立即执行</UI.Button>
              </div>
            </UI.Card>
          ))}
        </div>
      )}

      <UI.Modal open={newOpen} onClose={() => setNewOpen(false)} title="创建狩猎任务" description="通过自然语言查询、假设验证或 IOC 溯源发起主动威胁狩猎" width={620}
        footer={<>
          <UI.Button onClick={() => setNewOpen(false)}>取消</UI.Button>
          <UI.Button variant="primary" leftIcon={<Icons.Play size={13}/>}>开始狩猎</UI.Button>
        </>}>
        <NewHuntForm />
      </UI.Modal>
    </div>
  );
}

function HuntTaskCard({ task }) {
  const statusMeta = {
    pending:   { tone:'neutral', label:'等待中', icon:<Icons.Clock size={11}/> },
    running:   { tone:'info', label:'执行中', icon:<Icons.Loader size={11} className="spin"/> },
    completed: { tone:'success', label:'已完成', icon:<Icons.Check size={11}/> },
    failed:    { tone:'destructive', label:'失败', icon:<Icons.Close size={11}/> },
  }[task.status];

  const fmt = ts => {
    const d = new Date(ts);
    return `${String(d.getUTCMonth()+1).padStart(2,'0')}/${String(d.getUTCDate()).padStart(2,'0')} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
  };

  return (
    <UI.Card style={{ padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <UI.Badge variant={task.mode === 'auto' ? 'solid' : 'muted'}>{task.mode === 'auto' ? '自动' : '手动'}</UI.Badge>
          <span style={{ fontSize:14, fontWeight:600 }}>{task.name}</span>
        </div>
        <UI.Badge tone={statusMeta.tone}>{statusMeta.icon} {statusMeta.label}</UI.Badge>
      </div>

      {task.hypothesis && (
        <div style={{ fontSize:12.5, color:'var(--muted-foreground)', marginBottom:10, lineHeight:1.55 }}>
          <span style={{ fontWeight:500, color:'var(--foreground)' }}>假设：</span>{task.hypothesis}
        </div>
      )}

      <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:11, color:'var(--muted-foreground)', marginBottom:12 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icons.Calendar size={11}/> {fmt(task.startedAt)}</span>
        {task.completedAt && <>
          <Icons.ArrowR size={11}/>
          <span className="mono">{fmt(task.completedAt)}</span>
        </>}
        <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icons.User size={11}/> {task.triggeredBy}</span>
      </div>

      {task.findings.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Icons.Alert size={13} style={{ color:'var(--warning)' }}/>
            <span style={{ fontSize:12.5, fontWeight:500 }}>发现 {task.findings.length} 条可疑记录</span>
          </div>
          {task.findings.map(f => (
            <div key={f.id} style={{ padding:'10px 12px', background:'var(--muted-2)', border:'1px solid var(--border)', borderRadius:6 }}>
              <UI.Badge tone={f.severity} style={{ marginBottom:6 }}>{PRIORITY_CONFIG[f.severity].label}</UI.Badge>
              <div style={{ fontSize:12.5, lineHeight:1.55, marginBottom:6 }}>{f.description}</div>
              <pre className="mono" style={{
                margin:0, padding:8, background:'#0a0a0a', color:'#d4d4d8',
                fontSize:11, lineHeight:1.5, borderRadius:4, whiteSpace:'pre-wrap',
              }}>{f.evidence}</pre>
              <div style={{ marginTop:8 }}>
                <UI.Button size="sm" leftIcon={<Icons.ArrowR size={11}/>}>转为事件</UI.Button>
              </div>
            </div>
          ))}
        </div>
      ) : task.status === 'completed' ? (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--muted-foreground)' }}>
          <Icons.Check size={13} style={{ color:'var(--success)' }}/> 未发现可疑活动
        </div>
      ) : task.status === 'running' ? (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--info)' }}>
          <Icons.Loader size={13} className="spin"/> 正在分析…
        </div>
      ) : null}
    </UI.Card>
  );
}

function NewHuntForm() {
  const [type, setType] = useStateHunt('query');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <UI.Tabs value={type} onChange={setType} items={[
        { value:'query', label:'自然语言', icon:<Icons.Search size={13}/> },
        { value:'hypothesis', label:'假设验证', icon:<Icons.Brain size={13}/> },
        { value:'ioc', label:'IOC 溯源', icon:<Icons.Target size={13}/> },
      ]} />

      {type === 'query' && (
        <>
          <Field label="自然语言查询" hint="AI 将自动转换为结构化查询并执行">
            <UI.Textarea placeholder="例如：过去 7 天里，有没有用户在下班时间（20 点后）访问了财务系统并下载了超过 100MB 的文件？" style={{ minHeight:110 }}/>
          </Field>
          <Field label="时间范围">
            <UI.Select value="7d" onChange={()=>{}} options={[
              { value:'24h', label:'近 24 小时' },
              { value:'7d', label:'近 7 天' },
              { value:'30d', label:'近 30 天' },
              { value:'90d', label:'近 90 天' },
            ]} />
          </Field>
        </>
      )}
      {type === 'hypothesis' && (
        <>
          <Field label="狩猎假设" hint="AI 将自动拆解为多个子查询并验证假设">
            <UI.Textarea placeholder="例如：我怀疑有攻击者通过供应商 VPN 账号在内网横向移动" style={{ minHeight:110 }}/>
          </Field>
          <Field label="关联场景">
            <UI.Select value="" onChange={()=>{}} placeholder="选择场景" options={Object.entries(SCENE_CONFIG).map(([k,v])=>({value:k, label:v.label}))}/>
          </Field>
        </>
      )}
      {type === 'ioc' && (
        <>
          <Field label="IOC 类型">
            <UI.Select value="" onChange={()=>{}} placeholder="选择类型" options={[
              { value:'ip', label:'IP 地址' },
              { value:'domain', label:'域名' },
              { value:'hash', label:'文件 Hash' },
              { value:'account', label:'账号' },
            ]}/>
          </Field>
          <Field label="IOC 值">
            <UI.Input placeholder="例如：185.220.101.34 或 malware.exe 的 SHA256"/>
          </Field>
          <Field label="溯源范围">
            <UI.Select value="all" onChange={()=>{}} options={[
              { value:'all', label:'全部日志类型' },
              { value:'auth', label:'认证日志' },
              { value:'network', label:'网络日志' },
              { value:'endpoint', label:'终端日志' },
            ]}/>
          </Field>
        </>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:12.5, fontWeight:500 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize:11, color:'var(--muted-foreground)' }}>{hint}</div>}
    </div>
  );
}

const huntHelpers = { Field };

/* Knowledge Base — 知识库 */

const { useState: useStateKb } = React;

const KB_TYPE_CONFIG = {
  entity_graph:         { label:'实体关系', tone:'info',    iconKey:'Network'  },
  behavior_baseline:    { label:'行为基线', tone:'purple',  iconKey:'Activity' },
  policy_context:       { label:'环境策略', tone:'warning', iconKey:'File'     },
  investigation_history:{ label:'历史调查', tone:'success', iconKey:'History'  },
  hunting_rule:         { label:'狩猎规则', tone:'critical',iconKey:'Target'   },
};

const KB_SOURCE_CONFIG = {
  auto:     { label:'自动学习', tone:'success' },
  feedback: { label:'反馈驱动', tone:'warning' },
  manual:   { label:'人工录入', tone:'neutral' },
};

function KnowledgePage() {
  const [tab, setTab] = useStateKb('list');
  const [search, setSearch] = useStateKb('');
  const [typeFilter, setTypeFilter] = useStateKb('all');
  const [sourceFilter, setSourceFilter] = useStateKb('all');
  const [newOpen, setNewOpen] = useStateKb(false);

  const filtered = mockKnowledgeEntries.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
    if (search) {
      const k = search.toLowerCase();
      const match = e.title.toLowerCase().includes(k) || e.content.toLowerCase().includes(k) || e.tags.some(t => t.toLowerCase().includes(k));
      if (!match) return false;
    }
    return true;
  });

  const totalRefs = mockKnowledgeEntries.reduce((s, e) => s + e.referenceCount, 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <UI.SectionTitle
        title="环境上下文"
        subtitle="管理企业环境知识，AI 调查时自动检索注入推理上下文"
        action={
          <div style={{ display:'flex', gap:8 }}>
            <UI.Button leftIcon={<Icons.Upload size={14}/>}>批量导入</UI.Button>
            <UI.Button variant="primary" leftIcon={<Icons.Plus size={14}/>} onClick={() => setNewOpen(true)}>新建知识</UI.Button>
          </div>
        }
      />

      {/* Stats strip */}
      <UI.Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)' }}>
          <KbStatCell label="知识总数" value={mockKnowledgeEntries.length} sub={`累计引用 ${totalRefs.toLocaleString()} 次`}/>
          {Object.entries(KB_TYPE_CONFIG).map(([k, cfg]) => {
            const Icon = Icons[cfg.iconKey];
            const cnt = mockKnowledgeEntries.filter(e => e.type === k).length;
            return (
              <KbStatCell key={k} label={cfg.label} value={cnt} icon={<Icon size={14}/>} tone={cfg.tone}/>
            );
          })}
        </div>
      </UI.Card>

      {/* Filters */}
      <UI.Card style={{ padding:'10px 12px' }}>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:'1 1 240px' }}>
            <UI.Input placeholder="搜索知识标题、内容或标签…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Icons.Search size={14}/>}/>
          </div>
          <UI.Select value={typeFilter} onChange={setTypeFilter} options={[
            { value:'all', label:'全部类型' },
            ...Object.entries(KB_TYPE_CONFIG).map(([k, v]) => ({ value:k, label:v.label })),
          ]} width={140}/>
          <UI.Select value={sourceFilter} onChange={setSourceFilter} options={[
            { value:'all', label:'全部来源' },
            ...Object.entries(KB_SOURCE_CONFIG).map(([k, v]) => ({ value:k, label:v.label })),
          ]} width={140}/>
          <div style={{ flex:1 }}/>
          <UI.Tabs value={tab} onChange={setTab} size="sm" items={[
            { value:'list', label:'卡片' },
            { value:'graph', label:'关系图' },
          ]}/>
        </div>
      </UI.Card>

      {tab === 'list' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
          {filtered.length === 0 ? (
            <UI.Card style={{ gridColumn:'span 3', padding:48, textAlign:'center' }}>
              <Icons.Search size={20} style={{ opacity:0.4 }}/>
              <div style={{ fontSize:13, color:'var(--muted-foreground)', marginTop:8 }}>未找到匹配的知识</div>
            </UI.Card>
          ) : filtered.map(e => <KnowledgeCard key={e.id} entry={e}/>)}
        </div>
      )}

      {tab === 'graph' && <KnowledgeGraph entries={filtered}/>}

      {/* Footer info */}
      <UI.Card style={{ padding:'16px 18px', background:'var(--muted-2)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:'#0a0a0a', color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Icons.Brain size={16}/>
          </div>
          <div>
            <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4 }}>知识库如何工作？</div>
            <div style={{ fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6 }}>
              知识库存储关于您企业环境的特定知识 — 实体关系、行为基线、安全策略和历史调查经验。AI 调查事件时，会自动检索相关知识注入推理上下文。
              目前已被调查引擎引用 <span style={{ fontWeight:600, color:'var(--foreground)' }} className="mono">{totalRefs.toLocaleString()}</span> 次。
            </div>
          </div>
        </div>
      </UI.Card>

      <UI.Modal open={newOpen} onClose={() => setNewOpen(false)} title="创建知识条目" description="添加新的知识条目，帮助 AI 更好地理解您的企业环境" width={580}
        footer={<>
          <UI.Button onClick={() => setNewOpen(false)}>取消</UI.Button>
          <UI.Button variant="primary" leftIcon={<Icons.Plus size={13}/>}>创建</UI.Button>
        </>}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <huntHelpers.Field label="知识类型">
            <UI.Select value="" onChange={()=>{}} placeholder="选择类型"
              options={Object.entries(KB_TYPE_CONFIG).map(([k,v])=>({value:k, label:v.label}))}/>
          </huntHelpers.Field>
          <huntHelpers.Field label="标题">
            <UI.Input placeholder="例如：账号 zhang.san 实体信息"/>
          </huntHelpers.Field>
          <huntHelpers.Field label="内容">
            <UI.Textarea placeholder="详细描述这条知识的内容…" style={{ minHeight:120 }}/>
          </huntHelpers.Field>
          <huntHelpers.Field label="标签" hint="例如：财务部, 高价值账号, VIP">
            <UI.Input placeholder="输入标签，用逗号分隔"/>
          </huntHelpers.Field>
        </div>
      </UI.Modal>
    </div>
  );
}

function KbStatCell({ label, value, sub, icon, tone }) {
  return (
    <div style={{ padding:'14px 18px', borderRight:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:11.5, color:'var(--muted-foreground)' }}>{label}</div>
        {icon && (
          <div style={{
            width:22, height:22, borderRadius:5,
            background: tone ? UI.tonePalette[tone].bg : 'var(--muted)',
            color: tone ? UI.tonePalette[tone].fg : 'var(--muted-foreground)',
            border: tone ? `1px solid ${UI.tonePalette[tone].bd}` : 'none',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>{icon}</div>
        )}
      </div>
      <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.02em', marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted-foreground)', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function KnowledgeCard({ entry }) {
  const cfg = KB_TYPE_CONFIG[entry.type];
  const TypeIcon = Icons[cfg.iconKey];
  const src = KB_SOURCE_CONFIG[entry.source];

  return (
    <UI.Card style={{ padding:16, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            width:24, height:24, borderRadius:6,
            background: UI.tonePalette[cfg.tone].bg, color: UI.tonePalette[cfg.tone].fg,
            border: `1px solid ${UI.tonePalette[cfg.tone].bd}`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <TypeIcon size={13}/>
          </div>
          <UI.Badge tone={cfg.tone}>{cfg.label}</UI.Badge>
        </div>
        <UI.Button variant="ghost" size="icon-sm"><Icons.More size={14}/></UI.Button>
      </div>

      <div style={{ fontSize:13.5, fontWeight:600, marginBottom:6, lineHeight:1.4 }}>{entry.title}</div>
      <div style={{
        fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6,
        display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden',
        flex:1,
      }}>{entry.content}</div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:4, margin:'12px 0' }}>
        {entry.tags.map(t => (
          <span key={t} style={{
            fontSize:11, padding:'2px 6px', borderRadius:4,
            background:'var(--muted)', color:'var(--muted-foreground)',
            display:'inline-flex', alignItems:'center', gap:2,
          }}><Icons.Hash size={10}/>{t}</span>
        ))}
      </div>

      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        paddingTop:10, borderTop:'1px solid var(--border)',
        fontSize:11, color:'var(--muted-foreground)',
      }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
          <UI.Dot tone={src.tone} size={6}/> {src.label}
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Icons.Eye size={11}/> {entry.referenceCount}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Icons.Clock size={11}/> {new Date(entry.updatedAt).toLocaleDateString('zh-CN', { month:'2-digit', day:'2-digit' })}</span>
        </span>
      </div>
    </UI.Card>
  );
}

// Simple knowledge relation graph (purely visual; arranges nodes radially around 'company')
function KnowledgeGraph({ entries }) {
  const nodes = entries.slice(0, 6);
  return (
    <UI.Card style={{ padding:20 }}>
      <div style={{ fontSize:13, color:'var(--muted-foreground)', marginBottom:12 }}>
        实体关系图（示意） · 节点 {nodes.length} 个
      </div>
      <div style={{ position:'relative', height:380, background:'var(--muted-2)', borderRadius:8, overflow:'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 800 380">
          {/* connections */}
          {nodes.map((_, i) => {
            const angle = (i / nodes.length) * Math.PI * 2;
            const cx = 400 + Math.cos(angle) * 140;
            const cy = 190 + Math.sin(angle) * 110;
            return <line key={i} x1="400" y1="190" x2={cx} y2={cy} stroke="#d4d4d8" strokeWidth="1" strokeDasharray="3 3"/>;
          })}
          {/* center node */}
          <circle cx="400" cy="190" r="34" fill="#0a0a0a"/>
          <text x="400" y="195" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="600" fontFamily="Inter">企业</text>
          {/* outer nodes */}
          {nodes.map((n, i) => {
            const angle = (i / nodes.length) * Math.PI * 2;
            const cx = 400 + Math.cos(angle) * 140;
            const cy = 190 + Math.sin(angle) * 110;
            const cfg = KB_TYPE_CONFIG[n.type];
            const pal = UI.tonePalette[cfg.tone];
            return (
              <g key={n.id}>
                <circle cx={cx} cy={cy} r="22" fill={pal.bg} stroke={pal.fg} strokeWidth="1.5"/>
                <text x={cx} y={cy + 4} textAnchor="middle" fill={pal.fg} fontSize="11" fontWeight="500" fontFamily="Inter">{cfg.label.slice(0,2)}</text>
                <text x={cx} y={cy + 38} textAnchor="middle" fill="#52525b" fontSize="10" fontFamily="Inter">{n.title.slice(0, 10)}{n.title.length > 10 ? '…' : ''}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </UI.Card>
  );
}

/* Atomic capability map — white canvas built from shadcn-style primitives. */

const CAPABILITY_DOMAINS = [
  { key:'A', title:'实体画像', iconKey:'User', tone:'info', summary:'把账号、主机、IP、域名、文件等调查对象标准化成可推理实体。' },
  { key:'B', title:'活动取证', iconKey:'Activity', tone:'warning', summary:'还原登录、进程、网络、邮件、云 API、数据访问等行为证据。' },
  { key:'C', title:'关系链路', iconKey:'Network', tone:'purple', summary:'连接实体、时间窗和跨源证据，形成事件关系图。' },
  { key:'D', title:'上下文', iconKey:'Database', tone:'success', summary:'补齐资产业务、身份、漏洞、基线和环境约束。' },
  { key:'E', title:'威胁情报', iconKey:'Globe', tone:'critical', summary:'接入信誉、MITRE、沙箱、归因、泄露和供应链情报。' },
  { key:'F', title:'判定处置', iconKey:'Shield', tone:'neutral', summary:'聚合证据给出 TP/FP、影响、时间线、报告和改进建议。' },
  { key:'G', title:'元推理', iconKey:'Brain', tone:'medium', summary:'驱动下一步、假设反证、路径优化、隐私守门和人在环路。' },
];

const ATOMIC_CAPABILITIES = [
  { id:'A1', phase:'P0', domain:'A', name:'用户/账户画像', ns:'investigate.entity.user.profile', sources:['DS-HR','DS-IDP','DS-EMAIL','DS-KB','DS-CMDB'] },
  { id:'A2', phase:'P0', domain:'A', name:'主机/终端画像', ns:'investigate.entity.host.profile', sources:['DS-CMDB','DS-EDR'] },
  { id:'A4', phase:'P0', domain:'A', name:'IP 地址画像', ns:'investigate.entity.ip.profile', sources:['DS-CMDB','DS-EDR','DS-FW','DS-TI','DS-KB'] },
  { id:'A5', phase:'P0', domain:'A', name:'域名画像', ns:'investigate.entity.domain.profile', sources:['DS-TI','DS-KB'] },
  { id:'A7', phase:'P0', domain:'A', name:'文件/哈希画像', ns:'investigate.entity.file.profile', sources:['DS-EDR','DS-EMAIL','DS-TI','DS-KB'] },
  { id:'A3', phase:'P1', domain:'A', name:'服务器画像', ns:'investigate.entity.server.profile', sources:['DS-CMDB','DS-VULN'] },
  { id:'A8', phase:'P1', domain:'A', name:'进程深度画像', ns:'investigate.entity.process.profile', sources:['DS-EDR'] },
  { id:'A11', phase:'P1', domain:'A', name:'云资源画像', ns:'investigate.entity.cloud_resource.profile', sources:['DS-CLOUD'] },
  { id:'A12', phase:'P1', domain:'A', name:'服务账户画像', ns:'investigate.entity.service_account.profile', sources:['DS-IDP','DS-CLOUD','DS-CODE'] },
  { id:'A6', phase:'P2', domain:'A', name:'URL 画像', ns:'investigate.entity.url.profile', sources:['DS-TI','DS-PROXY','DS-SANDBOX'] },
  { id:'A9', phase:'P2', domain:'A', name:'邮件地址画像', ns:'investigate.entity.email.profile', sources:['DS-EMAIL','DS-TI','DS-IDP'] },
  { id:'A10', phase:'P2', domain:'A', name:'证书画像', ns:'investigate.entity.cert.profile', sources:['DS-WHOIS','DS-TI'] },
  { id:'A13', phase:'P2', domain:'A', name:'移动设备 / BYOD 画像', ns:'investigate.entity.mobile_device.profile', sources:['DS-MOBILE','DS-IDP'] },
  { id:'A14', phase:'P2', domain:'A', name:'数据库账户 / 对象画像', ns:'investigate.entity.db_object.profile', sources:['DS-DAM','DS-CMDB'] },

  { id:'B1', phase:'P0', domain:'B', name:'登录活动', ns:'investigate.activity.login', sources:['DS-IDP'] },
  { id:'B3', phase:'P0', domain:'B', name:'进程执行', ns:'investigate.activity.process.execution', sources:['DS-EDR','DS-TI'] },
  { id:'B4', phase:'P0', domain:'B', name:'网络连接', ns:'investigate.activity.network.connection', sources:['DS-EDR','DS-FW'] },
  { id:'B8', phase:'P0', domain:'B', name:'邮件收发', ns:'investigate.activity.email', sources:['DS-EMAIL','DS-TI'] },
  { id:'B2', phase:'P1', domain:'B', name:'权限变更', ns:'investigate.activity.permission_change', sources:['DS-IDP','DS-CLOUD','DS-PAM'] },
  { id:'B5', phase:'P1', domain:'B', name:'DNS 活动', ns:'investigate.activity.dns', sources:['DS-DNS'] },
  { id:'B6', phase:'P1', domain:'B', name:'文件操作', ns:'investigate.activity.file_op', sources:['DS-EDR','DS-FILE','DS-CLOUD'] },
  { id:'B9', phase:'P1', domain:'B', name:'云 API 调用', ns:'investigate.activity.cloud_api', sources:['DS-CLOUD'] },
  { id:'B10', phase:'P1', domain:'B', name:'数据访问', ns:'investigate.activity.data_access', sources:['DS-DAM','DS-DLP','DS-CASB'] },
  { id:'B15', phase:'P1', domain:'B', name:'持久化行为', ns:'investigate.activity.persistence', sources:['DS-EDR','DS-AUDIT'] },
  { id:'B16', phase:'P1', domain:'B', name:'凭据访问', ns:'investigate.activity.credential_access', sources:['DS-EDR','DS-IDP'] },
  { id:'B17', phase:'P1', domain:'B', name:'防御规避', ns:'investigate.activity.defense_evasion', sources:['DS-EDR','DS-AV'] },
  { id:'B7', phase:'P2', domain:'B', name:'注册表/系统配置变更', ns:'investigate.activity.config_change', sources:['DS-EDR'] },
  { id:'B11', phase:'P2', domain:'B', name:'USB / 外设 / 可移动介质', ns:'investigate.activity.removable_media', sources:['DS-EDR','DS-DLP'] },
  { id:'B12', phase:'P2', domain:'B', name:'浏览器活动调查', ns:'investigate.activity.browser', sources:['DS-PROXY','DS-EDR'] },
  { id:'B13', phase:'P2', domain:'B', name:'SaaS / OAuth 调查', ns:'investigate.activity.saas_oauth', sources:['DS-CASB','DS-IDP'] },
  { id:'B14', phase:'P2', domain:'B', name:'容器 / Kubernetes 活动', ns:'investigate.activity.container', sources:['DS-CLOUD','DS-K8S'] },

  { id:'C1', phase:'P0', domain:'C', name:'时间窗共现', ns:'investigate.relation.timeline.cooccurrence', sources:['DS-SIEM'] },
  { id:'C2', phase:'P0', domain:'C', name:'实体关系图', ns:'investigate.relation.entity_graph', sources:['DS-IDP','DS-CMDB','DS-EDR'] },
  { id:'C3', phase:'P0', domain:'C', name:'父子进程链', ns:'investigate.relation.process_lineage', sources:['DS-EDR'] },
  { id:'C4', phase:'P1', domain:'C', name:'Kill-chain 阶段', ns:'investigate.relation.kill_chain_stage', sources:['Local ATT&CK'] },
  { id:'C5', phase:'P1', domain:'C', name:'横向移动路径', ns:'investigate.relation.lateral_movement', sources:['DS-IDP','DS-EDR','DS-NDR'] },
  { id:'C6', phase:'P1', domain:'C', name:'Fanout / Fanin', ns:'investigate.relation.fanout_fanin', sources:['DS-SIEM'] },
  { id:'C9', phase:'P1', domain:'C', name:'受害面扩展', ns:'investigate.relation.victim_expansion', sources:['DS-EDR','DS-NDR','DS-EMAIL','DS-IDP'] },
  { id:'C7', phase:'P2', domain:'C', name:'同源事件聚合', ns:'investigate.relation.same_origin', sources:['DS-SIEM','DS-KB'] },
  { id:'C8', phase:'P2', domain:'C', name:'跨数据源拼接', ns:'investigate.relation.cross_source_join', sources:['DS-SIEM','DS-EDR','DS-IDP'] },
  { id:'C10', phase:'P2', domain:'C', name:'异常路径检测', ns:'investigate.relation.rare_path', sources:['DS-SIEM','DS-NDR','DS-IDP'] },

  { id:'D1', phase:'P0', domain:'D', name:'资产业务上下文', ns:'investigate.context.asset_business', sources:['DS-CMDB'] },
  { id:'D2', phase:'P0', domain:'D', name:'用户身份上下文', ns:'investigate.context.user_identity', sources:['DS-HR','DS-IDP'] },
  { id:'D5', phase:'P0', domain:'D', name:'自身历史基线', ns:'investigate.context.baseline.self', sources:['DS-IDP','DS-EDR','DS-SIEM'] },
  { id:'D3', phase:'P1', domain:'D', name:'漏洞上下文', ns:'investigate.context.vulnerability', sources:['DS-VULN','DS-TI'] },
  { id:'D7', phase:'P1', domain:'D', name:'全局稀有度', ns:'investigate.context.rarity.global', sources:['DS-SIEM'] },
  { id:'D9', phase:'P1', domain:'D', name:'地理基线', ns:'investigate.context.geo_baseline', sources:['DS-IDP'] },
  { id:'D4', phase:'P2', domain:'D', name:'补丁 / 合规状态', ns:'investigate.context.compliance', sources:['DS-VULN','DS-CMDB'] },
  { id:'D6', phase:'P2', domain:'D', name:'同组对等基线', ns:'investigate.context.baseline.peer', sources:['DS-SIEM','DS-IDP'] },
  { id:'D8', phase:'P2', domain:'D', name:'业务时间窗', ns:'investigate.context.business_hours', sources:['DS-HR','DS-KB'] },
  { id:'D10', phase:'P2', domain:'D', name:'设备指纹基线', ns:'investigate.context.device_fingerprint', sources:['DS-IDP','DS-EDR'] },
  { id:'D11', phase:'P2', domain:'D', name:'网络位置基线', ns:'investigate.context.network_origin', sources:['DS-IDP','DS-VPN','DS-IPAM'] },

  { id:'E1', phase:'P0', domain:'E', name:'IP 信誉', ns:'investigate.intel.ip.reputation', sources:['DS-TI'] },
  { id:'E2', phase:'P0', domain:'E', name:'域名/URL 信誉', ns:'investigate.intel.domain_url.reputation', sources:['DS-TI'] },
  { id:'E3', phase:'P0', domain:'E', name:'文件 Hash 信誉', ns:'investigate.intel.hash.reputation', sources:['DS-TI'] },
  { id:'E7', phase:'P0', domain:'E', name:'TTP -> MITRE 映射', ns:'investigate.intel.ttp.mitre', sources:['Local ATT&CK','DS-KB'] },
  { id:'E5', phase:'P1', domain:'E', name:'沙箱引爆', ns:'investigate.intel.sandbox.detonate', sources:['DS-SANDBOX'] },
  { id:'E6', phase:'P1', domain:'E', name:'YARA / Sigma 命中', ns:'investigate.intel.yara_sigma', sources:['Local rules'] },
  { id:'E8', phase:'P1', domain:'E', name:'CVE 情报', ns:'investigate.intel.cve', sources:['DS-TI','NVD','KEV','EPSS'] },
  { id:'E4', phase:'P2', domain:'E', name:'WHOIS / pDNS / CT 历史', ns:'investigate.intel.domain.history', sources:['DS-WHOIS','DS-TI'] },
  { id:'E9', phase:'P2', domain:'E', name:'APT / 家族归因', ns:'investigate.intel.attribution', sources:['DS-TI','DS-KB'] },
  { id:'E10', phase:'P2', domain:'E', name:'凭据/数据泄露查询', ns:'investigate.intel.breach', sources:['DS-TI','DS-DLP'] },
  { id:'E11', phase:'P2', domain:'E', name:'品牌/钓鱼仿冒情报', ns:'investigate.intel.brand_lookalike', sources:['DS-TI','DS-WHOIS'] },
  { id:'E12', phase:'P2', domain:'E', name:'供应链 / 第三方风险情报', ns:'investigate.intel.supply_chain', sources:['DS-TI','DS-CODE'] },

  { id:'F1', phase:'P0', domain:'F', name:'TP/FP 判定', ns:'investigate.verdict.tp_fp', sources:['aggregate'] },
  { id:'F2', phase:'P0', domain:'F', name:'严重性/影响评估', ns:'investigate.verdict.impact', sources:['D1','D2'] },
  { id:'F4', phase:'P0', domain:'F', name:'IOC 提取与标准化', ns:'investigate.verdict.ioc_extract', sources:['aggregate'] },
  { id:'F8', phase:'P0', domain:'F', name:'处置建议', ns:'investigate.verdict.response_recommendation', sources:['F1','F2','F4'] },
  { id:'F3', phase:'P1', domain:'F', name:'Kill-chain 重建', ns:'investigate.verdict.kill_chain_reconstruction', sources:['aggregate'] },
  { id:'F6', phase:'P1', domain:'F', name:'时间线重建', ns:'investigate.verdict.timeline_reconstruction', sources:['aggregate'] },
  { id:'F7', phase:'P1', domain:'F', name:'受影响实体', ns:'investigate.verdict.affected_entities', sources:['aggregate'] },
  { id:'F9', phase:'P1', domain:'F', name:'根因分析', ns:'investigate.verdict.root_cause', sources:['aggregate'] },
  { id:'F5', phase:'P2', domain:'F', name:'攻击者画像', ns:'investigate.verdict.actor_profile', sources:['E9','C4','C5'] },
  { id:'F10', phase:'P2', domain:'F', name:'通报材料生成', ns:'investigate.verdict.report', sources:['F1','F2','F6','G7'] },
  { id:'F11', phase:'P2', domain:'F', name:'检测改进建议', ns:'investigate.verdict.detection_uplift', sources:['F9','E6'] },

  { id:'G3', phase:'P0', domain:'G', name:'不确定性与下一步', ns:'investigate.meta.next_step', sources:['Registry'] },
  { id:'G4', phase:'P0', domain:'G', name:'历史相似告警回查', ns:'investigate.meta.kb_lookup', sources:['DS-KB'] },
  { id:'G1', phase:'P1', domain:'G', name:'假设生成', ns:'investigate.meta.hypothesis_generate', sources:['Registry'] },
  { id:'G2', phase:'P1', domain:'G', name:'反证搜索', ns:'investigate.meta.counter_evidence', sources:['Registry'] },
  { id:'G5', phase:'P2', domain:'G', name:'调查路径优化', ns:'investigate.meta.path_optimizer', sources:['Registry','metrics'] },
  { id:'G6', phase:'P2', domain:'G', name:'证据链完整性自检', ns:'investigate.meta.evidence_integrity', sources:['EvidenceRef'] },
  { id:'G7', phase:'P2', domain:'G', name:'PII / 合规边界检查', ns:'investigate.meta.privacy_guard', sources:['privacy policy'] },
  { id:'G8', phase:'P2', domain:'G', name:'人在环路升级', ns:'investigate.meta.escalate', sources:['workflow'] },
];

const PHASE_META = {
  all: { label:'全部阶段', tone:'neutral' },
  P0: { label:'P0 可落地', tone:'success' },
  P1: { label:'P1 扩展', tone:'info' },
  P2: { label:'P2 完整版', tone:'purple' },
};

const CANONICAL_SOURCE_ORDER = [
  'DS-IDP','DS-HR','DS-CMDB','DS-EDR','DS-SIEM','DS-EMAIL','DS-FW','DS-TI','DS-KB',
  'DS-CLOUD','DS-NDR','DS-DLP','DS-CASB','DS-DAM','DS-PAM','DS-VULN','DS-SANDBOX',
  'DS-WHOIS','DS-DNS','DS-PROXY','DS-FILE','DS-VPN','DS-IPAM','DS-AV','DS-CODE',
];

const INCIDENT_SCENARIOS = [
  {
    key:'all',
    title:'全部能力集合',
    entry:'完整能力库',
    iconKey:'Network',
    tone:'neutral',
    description:'查看 A-G 七大域下的完整原子能力全集。',
    capabilityIds: ATOMIC_CAPABILITIES.map(c => c.id),
  },
  {
    key:'phishing',
    title:'钓鱼邮件告警',
    entry:'外部邮件含可疑链接',
    iconKey:'Mail',
    tone:'critical',
    description:'从发件人、链接、附件、点击行为到 IOC 与处置建议。',
    capabilityIds:['A9','A1','B8','A6','E2','E5','A7','E3','D9','E11','C9','B12','C1','F1','F4','F8','G4'],
  },
  {
    key:'account_login',
    title:'账号异地登录 / 爆破',
    entry:'IDP 异常登录行为',
    iconKey:'Key',
    tone:'info',
    description:'从账号、源 IP、地理位置、失败激增到账号处置建议。',
    capabilityIds:['A1','A4','B1','D2','D5','D9','D11','E1','E10','C1','C6','F1','F8','G4'],
  },
  {
    key:'web_behavior',
    title:'员工上网风险行为',
    entry:'访问危险网站 / 下载木马',
    iconKey:'Globe',
    tone:'warning',
    description:'面向上网行为管理，识别危险站点、恶意下载与员工风险。',
    capabilityIds:['A1','A4','A5','A6','A7','B4','B6','B12','D5','D6','E2','E3','E5','C1','F1','F4','F8'],
  },
];

function AtomicCapabilitiesPage() {
  const [phase, setPhase] = useState('all');
  const [scenario, setScenario] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('A1');
  const [tryRunOpen, setTryRunOpen] = useState(false);
  const [scenarioCatalog, setScenarioCatalog] = useState(null);

  useEffect(() => {
    if (scenarioCatalog) return;
    fetch('/api/capabilities/scenarios')
      .then(r => r.json())
      .then(j => setScenarioCatalog(j))
      .catch(() => setScenarioCatalog({}));
  }, [scenarioCatalog]);

  const activeScenario = INCIDENT_SCENARIOS.find(s => s.key === scenario) || INCIDENT_SCENARIOS[0];
  const selectedCap = ATOMIC_CAPABILITIES.find(c => c.id === selected) || ATOMIC_CAPABILITIES[0];
  const selectedDetail = CAPABILITY_DETAILS[selectedCap.id] || {};

  const matchesStageAndSearch = cap => {
    if (phase !== 'all' && cap.phase !== phase) return false;
    if (!activeScenario.capabilityIds.includes(cap.id)) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const haystack = [cap.id, cap.name, cap.ns, cap.phase, cap.domain, ...cap.sources].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };

  const matchesCardFilters = cap => {
    if (phase !== 'all' && cap.phase !== phase) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const haystack = [cap.id, cap.name, cap.ns, cap.phase, cap.domain, ...cap.sources].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };

  const visible = ATOMIC_CAPABILITIES.filter(matchesStageAndSearch);

  const phaseCounts = ['P0','P1','P2'].map(p => ({ phase:p, count:ATOMIC_CAPABILITIES.filter(c => c.phase === p).length }));
  const scenarioPhaseCounts = ['P0','P1','P2'].map(p => ({
    phase:p,
    count:ATOMIC_CAPABILITIES.filter(c => activeScenario.capabilityIds.includes(c.id) && c.phase === p).length,
  }));
  const selectedDomain = CAPABILITY_DOMAINS.find(d => d.key === selectedCap.domain);
  const selectedIcon = Icons[selectedDomain?.iconKey || 'Network'];
  const selectedPal = UI.tonePalette[selectedDomain?.tone || 'neutral'] || UI.tonePalette.neutral;
  const sourceCounts = CANONICAL_SOURCE_ORDER
    .map(source => ({
      source,
      count: visible.filter(cap => cap.sources.includes(source)).length,
      selected: selectedCap.sources.includes(source),
    }))
    .filter(item => item.count > 0);
  const selectedIndex = visible.findIndex(cap => cap.id === selectedCap.id);

  return (
    <div style={{
      minHeight:'calc(100vh - 128px)',
      background:'#fff',
      border:'1px solid var(--border)',
      borderRadius:8,
      padding:24,
      boxShadow:'var(--shadow-xs)',
      maxWidth:1500,
      margin:'0 auto',
      display:'flex',
      flexDirection:'column',
      gap:18,
      overflowX:'hidden',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{
              width:36, height:36, borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'#0a0a0a', color:'#fff',
            }}>
              <Icons.Network size={18}/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:24, lineHeight:1.2, letterSpacing:0, fontWeight:650 }}>原子能力知识图谱</h1>
              <div style={{ marginTop:3, fontSize:13, color:'var(--muted-foreground)' }}>
                按三类典型告警场景筛选依赖能力 · 保留 A-G 全量能力集合
              </div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
          <UI.Badge tone="success">P0 {phaseCounts[0].count}</UI.Badge>
          <UI.Badge tone="info">P1 {phaseCounts[1].count}</UI.Badge>
          <UI.Badge tone="purple">P2 {phaseCounts[2].count}</UI.Badge>
          <UI.Badge variant="solid">总计 {ATOMIC_CAPABILITIES.length}</UI.Badge>
        </div>
      </div>

      <UI.Card style={{ padding:12, boxShadow:'none' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'center' }}>
          <UI.Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索能力编号、名称、命名空间或数据源..."
            leftIcon={<Icons.Search size={14}/>}
          />
          <UI.Tabs value={phase} onChange={setPhase} size="sm" items={[
            { value:'all', label:'全部' },
            { value:'P0', label:'P0' },
            { value:'P1', label:'P1' },
            { value:'P2', label:'P2' },
          ]}/>
        </div>
      </UI.Card>

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(4, minmax(0, 1fr))',
        gap:10,
        overflow:'hidden',
      }}>
        {INCIDENT_SCENARIOS.map(item => {
          const Icon = Icons[item.iconKey];
          const pal = UI.tonePalette[item.tone] || UI.tonePalette.neutral;
          const scenarioCaps = ATOMIC_CAPABILITIES.filter(c => item.capabilityIds.includes(c.id));
          const visibleCount = scenarioCaps.filter(matchesCardFilters).length;
          const active = scenario === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setScenario(item.key);
                setSelected(item.capabilityIds[0] || 'A1');
              }}
              style={{
                minHeight:116,
                minWidth:0,
                padding:'12px 12px 10px',
                borderRadius:8,
                border: active ? `1px solid ${pal.fg}` : '1px solid var(--border)',
                background:active ? pal.bg : '#fff',
                cursor:'pointer',
                textAlign:'left',
                fontFamily:'inherit',
                display:'flex',
                flexDirection:'column',
                justifyContent:'space-between',
                boxShadow:active ? 'var(--shadow-sm)' : 'none',
                overflow:'hidden',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <span style={{
                  width:28, height:28, borderRadius:7,
                  background:pal.bg, color:pal.fg, border:`1px solid ${pal.bd}`,
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                }}><Icon size={14}/></span>
                <span className="mono" style={{
                  minWidth:0,
                  fontSize:11,
                  fontWeight:750,
                  color:pal.fg,
                  whiteSpace:'nowrap',
                  overflow:'hidden',
                  textOverflow:'ellipsis',
                }}>{item.entry}</span>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:650, color:'var(--foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</div>
                <div style={{ fontSize:11.5, color:'var(--muted-foreground)', marginTop:4, lineHeight:1.35, height:31, overflow:'hidden' }}>{item.description}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginTop:9 }}>
                  <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>场景依赖</span>
                  <span className="mono" style={{
                    fontSize:11,
                    lineHeight:'18px',
                    padding:'0 6px',
                    borderRadius:4,
                    border:`1px solid ${pal.bd}`,
                    background:'#fff',
                    color:pal.fg,
                    fontWeight:750,
                    whiteSpace:'nowrap',
                  }}>
                    {visibleCount === scenarioCaps.length ? `${scenarioCaps.length} 项` : `${visibleCount}/${scenarioCaps.length} 项`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <CapabilityPipeline selected={selectedCap} />

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 2fr) 360px', gap:16, alignItems:'start' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:14 }}>
          {CAPABILITY_DOMAINS.filter(d => scenario === 'all' || visible.some(c => c.domain === d.key)).map(d => {
            const caps = visible.filter(c => c.domain === d.key);
            const allCaps = ATOMIC_CAPABILITIES.filter(c => c.domain === d.key);
            const countBase = scenario === 'all' ? allCaps : caps;
            const Icon = Icons[d.iconKey];
            const pal = UI.tonePalette[d.tone] || UI.tonePalette.neutral;
            return (
              <UI.Card key={d.key} style={{
                padding:16,
                minHeight:228,
                boxShadow:'none',
                borderColor: selectedCap.domain === d.key ? pal.bd : 'var(--border)',
                background: selectedCap.domain === d.key ? `linear-gradient(180deg, ${pal.bg}, #fff 36%)` : '#fff',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{
                      width:32, height:32, borderRadius:8,
                      background:pal.bg, color:pal.fg, border:`1px solid ${pal.bd}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icon size={16}/>
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:650 }}>{d.key} · {d.title}</div>
                      <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:2 }}>{d.summary}</div>
                      <div style={{ display:'flex', gap:5, marginTop:8 }}>
                        {['P0','P1','P2'].map(p => (
                          <span key={p} className="mono" style={{
                            fontSize:10.5,
                            padding:'2px 5px',
                            borderRadius:4,
                            background:'#fff',
                            border:'1px solid var(--border)',
                            color:'var(--muted-foreground)',
                          }}>{p} {countBase.filter(c => c.phase === p).length}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <UI.Badge tone={d.tone}>{caps.length}</UI.Badge>
                </div>

                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {caps.length === 0 ? (
                    <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>当前筛选下暂无能力</span>
                  ) : caps.map(cap => (
                    <button
                      key={cap.id}
                      onClick={() => setSelected(cap.id)}
                      title={cap.ns}
                      style={{
                        display:'inline-flex',
                        alignItems:'center',
                        gap:7,
                        height:32,
                        padding:'0 9px',
                        borderRadius:6,
                        border: selected === cap.id ? '1px solid #0a0a0a' : '1px solid var(--border)',
                        background:selected === cap.id ? '#0a0a0a' : '#fff',
                        color:selected === cap.id ? '#fff' : 'var(--foreground)',
                        cursor:'pointer',
                        boxShadow:selected === cap.id ? 'var(--shadow-sm)' : 'none',
                        fontFamily:'inherit',
                        maxWidth:'100%',
                      }}
                    >
                      <span className="mono" style={{
                        fontSize:11,
                        fontWeight:650,
                        color:selected === cap.id ? '#fff' : pal.fg,
                      }}>{cap.id}</span>
                      <span style={{ fontSize:12.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cap.name}</span>
                      <span style={{
                        fontSize:10.5,
                        padding:'1px 5px',
                        borderRadius:4,
                        background:selected === cap.id ? 'rgba(255,255,255,.16)' : 'var(--muted)',
                        color:selected === cap.id ? '#fff' : 'var(--muted-foreground)',
                      }}>{cap.phase}</span>
                    </button>
                  ))}
                </div>
              </UI.Card>
            );
          })}
        </div>

        <div style={{ position:'sticky', top:0, display:'flex', flexDirection:'column', gap:14 }}>
          <UI.Card style={{ padding:18, boxShadow:'none' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:38, height:38, borderRadius:9,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:selectedPal.fg, color:'#fff',
                }}>
                  {React.createElement(selectedIcon, { size:18 })}
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:700 }}>{selectedCap.id} · {selectedCap.name}</div>
                  <div style={{ fontSize:12, color:'var(--muted-foreground)' }}>{selectedDomain?.title}</div>
                </div>
              </div>
              <UI.Badge tone={PHASE_META[selectedCap.phase].tone}>{selectedCap.phase}</UI.Badge>
            </div>
            <div className="mono" style={{
              padding:'10px 12px',
              border:'1px solid var(--border)',
              borderRadius:6,
              background:'var(--muted-2)',
              fontSize:12,
              color:'#3f3f46',
              overflowWrap:'anywhere',
              marginTop:12,
              marginBottom:14,
            }}>{selectedCap.ns}</div>
            <div style={{ fontSize:12, color:'var(--muted-foreground)', marginBottom:8 }}>依赖数据源 / 上游能力</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {selectedCap.sources.map(source => (
                <UI.Badge key={source} variant="muted">{source}</UI.Badge>
              ))}
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns:'1fr 1fr',
              gap:8,
              marginTop:16,
              paddingTop:14,
              borderTop:'1px solid var(--border)',
            }}>
              <CapabilityFact label="当前场景" value={activeScenario.title} />
              <CapabilityFact label="能力域" value={`${selectedCap.domain} · ${selectedDomain?.title || ''}`} />
              <CapabilityFact label="场景序号" value={selectedIndex >= 0 ? `${selectedIndex + 1} / ${visible.length}` : '-'} />
              <CapabilityFact label="阶段" value={PHASE_META[selectedCap.phase].label} />
              <CapabilityFact label="依赖数" value={selectedCap.sources.length} />
            </div>
            {RUNNABLE_CAPABILITIES.has(selectedCap.id) && (
              <button
                onClick={() => setTryRunOpen(true)}
                style={{
                  marginTop:16,
                  width:'100%',
                  padding:'12px 14px',
                  borderRadius:8,
                  border:'1px solid #0a0a0a',
                  background:'#0a0a0a',
                  color:'#fff',
                  cursor:'pointer',
                  fontFamily:'inherit',
                  fontSize:14,
                  fontWeight:650,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:8,
                  boxShadow:'var(--shadow-sm)',
                }}
              >
                <span>▶ 试运行</span>
                {scenarioCatalog?.[selectedCap.id]?.length > 0 && (
                  <span style={{ fontSize:12, fontWeight:500, opacity:0.8 }}>
                    · {scenarioCatalog[selectedCap.id].length} 个预设场景
                  </span>
                )}
              </button>
            )}
          </UI.Card>

          {selectedDetail.purpose && (
            <UI.Card style={{ padding:18, boxShadow:'none' }}>
              <div style={{ fontSize:14, fontWeight:650, marginBottom:8 }}>目的</div>
              <div style={{ fontSize:13, color:'var(--muted-foreground)', lineHeight:1.6 }}>{selectedDetail.purpose}</div>
            </UI.Card>
          )}

          {selectedDetail.inputs && selectedDetail.inputs.length > 0 && (
            <UI.Card style={{ padding:18, boxShadow:'none' }}>
              <div style={{ fontSize:14, fontWeight:650, marginBottom:10 }}>输入</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'4px 10px', alignItems:'start' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--muted-foreground)', paddingBottom:4, borderBottom:'1px solid var(--border)' }}>字段</div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--muted-foreground)', paddingBottom:4, borderBottom:'1px solid var(--border)', textAlign:'center' }}>必填</div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--muted-foreground)', paddingBottom:4, borderBottom:'1px solid var(--border)' }}>说明</div>
                {selectedDetail.inputs.map((inp, i) => (
                  <React.Fragment key={i}>
                    <code className="mono" style={{ fontSize:11, padding:'2px 4px', background:'var(--muted-2)', borderRadius:3 }}>{inp.field}</code>
                    <div style={{ textAlign:'center', fontSize:12 }}>{inp.required ? '✓' : '—'}</div>
                    <div style={{ fontSize:12, color:'var(--muted-foreground)' }}>{inp.desc}</div>
                  </React.Fragment>
                ))}
              </div>
            </UI.Card>
          )}

          {selectedDetail.dataQueries && selectedDetail.dataQueries.length > 0 && (
            <UI.Card style={{ padding:18, boxShadow:'none', border:'1px solid var(--border)', background:'var(--muted-2)' }}>
              <div style={{ fontSize:14, fontWeight:650, marginBottom:10 }}>去哪里查 → 查什么</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {selectedDetail.dataQueries.map((q, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'20px auto 1fr', gap:'4px 8px', alignItems:'start', paddingBottom:8, borderBottom: i < selectedDetail.dataQueries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize:11, color:'var(--muted-foreground)', paddingTop:2, fontVariantNumeric:'tabular-nums' }}>{q.order}</div>
                    <UI.Badge variant="muted" style={{ fontSize:10.5, whiteSpace:'nowrap', alignSelf:'start', marginTop:1 }}>{q.source}</UI.Badge>
                    <div>
                      <div style={{ fontSize:12, lineHeight:1.5 }}>{q.look}</div>
                      {q.keys && <code className="mono" style={{ fontSize:10.5, color:'var(--muted-foreground)', display:'block', marginTop:2 }}>{q.keys}</code>}
                    </div>
                  </div>
                ))}
              </div>
            </UI.Card>
          )}

          {selectedDetail.outputs && selectedDetail.outputs.length > 0 && (
            <UI.Card style={{ padding:18, boxShadow:'none' }}>
              <div style={{ fontSize:14, fontWeight:650, marginBottom:10 }}>输出 Schema</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {selectedDetail.outputs.map((o, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'start' }}>
                    <code className="mono" style={{ fontSize:11, padding:'2px 5px', background:'var(--muted-2)', borderRadius:3, whiteSpace:'nowrap' }}>{o.field}</code>
                    <div style={{ fontSize:12, color:'var(--muted-foreground)', paddingTop:2 }}>{o.desc}</div>
                  </div>
                ))}
              </div>
            </UI.Card>
          )}

          {((selectedDetail.triggers && selectedDetail.triggers.length > 0) || (selectedDetail.notes && selectedDetail.notes.length > 0)) && (
            <UI.Card style={{ padding:18, boxShadow:'none' }}>
              <div style={{ fontSize:14, fontWeight:650, marginBottom:10 }}>触发与备注</div>
              {selectedDetail.triggers && selectedDetail.triggers.length > 0 && (
                <div style={{ marginBottom: selectedDetail.notes && selectedDetail.notes.length > 0 ? 12 : 0 }}>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:6, color:'var(--muted-foreground)' }}>典型触发</div>
                  <ul style={{ margin:0, paddingLeft:16, display:'flex', flexDirection:'column', gap:4 }}>
                    {selectedDetail.triggers.map((t, i) => (
                      <li key={i} style={{ fontSize:12, lineHeight:1.5 }}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedDetail.notes && selectedDetail.notes.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:6, color:'var(--muted-foreground)' }}>备注</div>
                  <ul style={{ margin:0, paddingLeft:16, display:'flex', flexDirection:'column', gap:4 }}>
                    {selectedDetail.notes.map((n, i) => (
                      <li key={i} style={{ fontSize:12, lineHeight:1.5 }}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </UI.Card>
          )}

          <SourceCoveragePanel sources={sourceCounts} selectedSources={selectedCap.sources} />

          {RUNNABLE_CAPABILITIES.has(selectedCap.id) && (
            <TryRunModal
              open={tryRunOpen}
              onClose={() => setTryRunOpen(false)}
              capId={selectedCap.id}
              capName={selectedCap.name}
              scenarios={scenarioCatalog?.[selectedCap.id] || []}
            />
          )}

          <UI.Card style={{ padding:18, boxShadow:'none' }}>
            <div style={{ fontSize:14, fontWeight:650, marginBottom:12 }}>架构层次</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <ArchitectureRow icon={<Icons.Settings size={14}/>} title="Core" detail="Schema / Context / Errors / Observability" />
              <ArchitectureRow icon={<Icons.Database size={14}/>} title="DataSource Adapter" detail="IDP / HR / CMDB / EDR / SIEM / Email / TI / KB" />
              <ArchitectureRow icon={<Icons.Command size={14}/>} title="Capability" detail="单文件单能力，通过 Registry 动态发现" />
            </div>
          </UI.Card>

          <UI.Card style={{ padding:18, boxShadow:'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:650 }}>阶段覆盖</div>
              <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>{visible.length} / {ATOMIC_CAPABILITIES.length}</span>
            </div>
            {scenarioPhaseCounts.map(item => (
              <div key={item.phase} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                  <span>{PHASE_META[item.phase].label}</span>
                  <span className="mono">{item.count}</span>
                </div>
                <UI.Progress value={(item.count / activeScenario.capabilityIds.length) * 100} height={7}/>
              </div>
            ))}
          </UI.Card>
        </div>
      </div>
    </div>
  );
}

function TryRunModal({ open, onClose, capId, capName, scenarios }) {
  const [scenarioId, setScenarioId] = useState(scenarios?.[0]?.id ?? '');
  const [customInputsJson, setCustomInputsJson] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && scenarios?.length > 0) setScenarioId(scenarios[0].id);
    if (!open) { setResult(null); setError(null); setCustomInputsJson(''); }
  }, [open, capId, scenarios]);

  async function handleRun() {
    setRunning(true); setError(null); setResult(null);
    let customInputs = undefined;
    if (customInputsJson.trim()) {
      try { customInputs = JSON.parse(customInputsJson); }
      catch (e) { setError('自定义输入 JSON 解析失败: ' + e.message); setRunning(false); return; }
    }
    try {
      const res = await fetch('/api/capabilities/run', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          capability_id: capId,
          scenario_id: scenarioId,
          ...(customInputs ? { custom_inputs: customInputs } : {}),
        }),
      });
      const j = await res.json();
      if (j.ok) setResult(j);
      else setError(j.error || 'unknown error');
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <UI.Modal open={open} onClose={onClose} title={`${capId} · ${capName} · 试运行`} width={720}>
      <div style={{ display:'grid', gap:14 }}>
        <div>
          <div style={{ fontSize:12, color:'var(--muted-foreground)', marginBottom:6 }}>预设场景</div>
          <UI.Select value={scenarioId} onChange={setScenarioId}
            options={(scenarios || []).map(s => ({ value: s.id, label: s.label }))}
            placeholder={scenarios?.length ? '选择场景' : '无预设场景'} />
        </div>
        <div>
          <div style={{ fontSize:12, color:'var(--muted-foreground)', marginBottom:6 }}>自定义输入（可选 JSON，覆盖场景 inputs）</div>
          <UI.Textarea value={customInputsJson}
            onChange={e => setCustomInputsJson(e.target.value)}
            placeholder='例如：{"principal": "custom@corp"}'
            style={{ minHeight: 80, fontFamily:'var(--mono-font)' }} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <UI.Button onClick={handleRun} disabled={running}>
            {running ? '运行中…' : '运行'}
          </UI.Button>
        </div>

        {error && (
          <div style={{ padding:10, border:'1px solid var(--critical-200)', background:'var(--critical-50)', borderRadius:6, fontSize:12, color:'var(--critical-emphasis)' }}>
            ❌ {error}
          </div>
        )}

        {result && (
          <UI.Card style={{ padding:14, boxShadow:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <UI.Badge tone={result.result.partial ? 'warning' : 'success'}>
                {result.result.partial ? 'PARTIAL' : 'OK'}
              </UI.Badge>
              <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>
                {result.result.duration_ms} ms · confidence {result.result.confidence}
              </span>
            </div>
            {result.result.partial && result.result.partial_reasons?.length > 0 && (
              <div style={{ fontSize:12, color:'var(--warning-emphasis)', marginBottom:8 }}>
                {result.result.partial_reasons.map((r,i) => (<div key={i}>· {r}</div>))}
              </div>
            )}
            <VerdictSummary capId={capId} payload={result.result.payload} />
            <details style={{ marginTop:10 }}>
              <summary style={{ cursor:'pointer', fontSize:12, color:'var(--muted-foreground)' }}>原始 JSON</summary>
              <pre style={{
                marginTop:8,
                padding:10, border:'1px solid var(--border)',
                background:'var(--muted-2)', borderRadius:6,
                fontSize:11.5, lineHeight:1.55, overflowX:'auto',
                maxHeight: 320, whiteSpace:'pre-wrap',
              }}>
                {JSON.stringify(result.result.payload, null, 2)}
              </pre>
            </details>
          </UI.Card>
        )}
      </div>
    </UI.Modal>
  );
}

function VerdictSummary({ capId, payload }) {
  if (!payload) return null;

  const Pill = ({ tone='neutral', children, style }) => {
    const pal = UI.tonePalette[tone] || UI.tonePalette.neutral;
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:4,
        fontSize:11, fontWeight:650, lineHeight:'20px',
        padding:'0 8px', borderRadius:4,
        background:pal.bg, color:pal.fg, border:`1px solid ${pal.bd}`,
        ...style,
      }}>{children}</span>
    );
  };

  const Row = ({ label, children }) => (
    <div style={{ display:'grid', gridTemplateColumns:'92px 1fr', gap:10, alignItems:'baseline', fontSize:12, marginBottom:6 }}>
      <span style={{ color:'var(--muted-foreground)' }}>{label}</span>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>{children}</div>
    </div>
  );

  // ---- A1: user profile ----
  if (capId === 'A1') {
    const tags = payload.risk_tags || [];
    const id = payload.identity || {};
    const auth = payload.auth || {};
    const fwd = payload.email?.forwarding_rules || [];
    const tagTone = t => ({ leaver_30d:'warning', priv_no_mfa:'critical', external_forwarding:'critical', watchlist:'critical' }[t] || 'info');
    return (
      <div style={{ padding:'10px 12px', borderRadius:6, background:'var(--muted-2)', border:'1px solid var(--border)' }}>
        <Row label="风险标签">
          {tags.length === 0 ? <span style={{ color:'var(--muted-foreground)', fontSize:12 }}>无</span>
            : tags.map(t => <Pill key={t} tone={tagTone(t)}>{t}</Pill>)}
        </Row>
        <Row label="身份">
          <span style={{ fontSize:12 }}>{id.display_name || '?'} · {id.department || '?'} · {id.status || '?'}</span>
        </Row>
        <Row label="认证">
          <Pill tone={auth.mfa_enabled ? 'success' : 'critical'}>MFA {auth.mfa_enabled ? '✓' : '✗'}</Pill>
          <Pill tone={auth.is_privileged ? 'warning' : 'neutral'}>特权 {auth.is_privileged ? '✓' : '—'}</Pill>
          {auth.locked && <Pill tone="critical">已锁定</Pill>}
        </Row>
        {fwd.length > 0 && (
          <Row label="外发转发">
            {fwd.map((r,i) => <Pill key={i} tone={r.external ? 'critical' : 'neutral'}>{r.target}</Pill>)}
          </Row>
        )}
        <Row label="历史告警">
          <span className="mono" style={{ fontSize:12 }}>{payload.prior_alerts_30d ?? 0} (30d)</span>
        </Row>
      </div>
    );
  }

  // ---- B8: email activity ----
  if (capId === 'B8') {
    const ps = payload.phishing_signals || {};
    const hits = [
      ps.auth_failure && 'auth_failure',
      ps.urgency_keywords?.length > 0 && 'urgency_keywords',
      ps.suspicious_link && 'suspicious_link',
      ps.lookalike_sender && 'lookalike_sender',
    ].filter(Boolean);
    return (
      <div style={{ padding:'10px 12px', borderRadius:6, background:'var(--muted-2)', border:'1px solid var(--border)' }}>
        <Row label="钓鱼信号">
          {hits.length === 0
            ? <Pill tone="success">无明显信号</Pill>
            : <>
                <Pill tone={hits.length >= 3 ? 'critical' : 'warning'}>{hits.length}/4 命中</Pill>
                {hits.map(h => <Pill key={h} tone="warning">{h}</Pill>)}
              </>}
        </Row>
        {ps.urgency_keywords?.length > 0 && (
          <Row label="紧迫关键词">
            {ps.urgency_keywords.map(k => <Pill key={k} tone="warning">{k}</Pill>)}
          </Row>
        )}
        <Row label="批量发送">
          <Pill tone={payload.mass_send_indicator ? 'warning' : 'neutral'}>
            {payload.mass_send_indicator ? '是' : '否'}
          </Pill>
        </Row>
        <Row label="邮件数">
          <span className="mono" style={{ fontSize:12 }}>{(payload.messages || []).length}</span>
        </Row>
      </div>
    );
  }

  // ---- E2: domain/url reputation ----
  if (capId === 'E2') {
    const verdict = payload.verdict || 'unknown';
    const verdictTone = { malicious:'critical', suspicious:'warning', clean:'success', unknown:'neutral' }[verdict] || 'neutral';
    return (
      <div style={{ padding:'10px 12px', borderRadius:6, background:'var(--muted-2)', border:'1px solid var(--border)' }}>
        <Row label="信誉判定">
          <Pill tone={verdictTone} style={{ fontSize:12, padding:'2px 10px' }}>{verdict.toUpperCase()}</Pill>
          {payload.age_days != null && <Pill tone={payload.age_days < 30 ? 'warning' : 'neutral'}>注册 {payload.age_days}d</Pill>}
        </Row>
        {(payload.categories || []).length > 0 && (
          <Row label="分类">
            {payload.categories.map(c => <Pill key={c} tone="critical">{c}</Pill>)}
          </Row>
        )}
        {(payload.tags || []).length > 0 && (
          <Row label="标签">
            {payload.tags.map(t => <Pill key={t} tone="warning">{t}</Pill>)}
          </Row>
        )}
        {(payload.sources || []).length > 0 && (
          <Row label="信息源">
            {payload.sources.map((s,i) => <Pill key={i} tone="neutral">{s.name}{s.score!=null?` ${s.score}`:''}</Pill>)}
          </Row>
        )}
      </div>
    );
  }

  // ---- F1: TP/FP verdict ----
  if (capId === 'F1') {
    const v = payload.verdict || 'INC';
    const tone = { TP:'critical', FP:'success', BP:'info', INC:'warning' }[v] || 'neutral';
    return (
      <div style={{ padding:'10px 12px', borderRadius:6, background:'var(--muted-2)', border:'1px solid var(--border)' }}>
        <Row label="判定">
          <Pill tone={tone} style={{ fontSize:13, padding:'3px 12px' }}>{v}</Pill>
          <Pill tone="neutral">conf {payload.confidence ?? '?'}</Pill>
        </Row>
        {(payload.key_reasons || []).length > 0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:4 }}>关键理由</div>
            <ul style={{ margin:0, paddingLeft:18, fontSize:12, lineHeight:1.6 }}>
              {payload.key_reasons.map((r,i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        {(payload.counter_evidence || []).length > 0 && (
          <div style={{ marginTop:6 }}>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:4 }}>反证</div>
            <ul style={{ margin:0, paddingLeft:18, fontSize:12, lineHeight:1.6, color:'var(--muted-foreground)' }}>
              {payload.counter_evidence.map((r,i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        {(payload.remaining_uncertainties || []).length > 0 && (
          <div style={{ marginTop:6 }}>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:4 }}>剩余不确定性</div>
            <ul style={{ margin:0, paddingLeft:18, fontSize:12, lineHeight:1.6, color:'var(--warning-emphasis)' }}>
              {payload.remaining_uncertainties.map((r,i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ---- F4: IOC extract ----
  if (capId === 'F4') {
    const iocs = payload.iocs || [];
    const byType = iocs.reduce((acc,i) => { acc[i.type] = (acc[i.type]||0)+1; return acc; }, {});
    return (
      <div style={{ padding:'10px 12px', borderRadius:6, background:'var(--muted-2)', border:'1px solid var(--border)' }}>
        <Row label="提取 IOC">
          <Pill tone={iocs.length > 0 ? 'critical' : 'neutral'} style={{ fontSize:12, padding:'2px 10px' }}>
            共 {iocs.length} 个
          </Pill>
          {Object.entries(byType).map(([t,n]) => <Pill key={t} tone="warning">{t} × {n}</Pill>)}
        </Row>
        {iocs.length > 0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:4 }}>前 5 条</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {iocs.slice(0,5).map((i,idx) => (
                <div key={idx} className="mono" style={{ fontSize:11, padding:'3px 8px', background:'#fff', border:'1px solid var(--border)', borderRadius:4 }}>
                  <span style={{ color:'var(--muted-foreground)' }}>{i.type}</span>　{i.value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- F8: response recommendation ----
  if (capId === 'F8') {
    const cont = payload.containment || [];
    const evid = payload.evidence_preservation || [];
    return (
      <div style={{ padding:'10px 12px', borderRadius:6, background:'var(--muted-2)', border:'1px solid var(--border)' }}>
        <Row label="处置建议">
          <Pill tone={cont.length > 0 ? 'critical' : 'success'} style={{ fontSize:12, padding:'2px 10px' }}>
            {cont.length === 0 ? '无动作' : `${cont.length} 项遏制`}
          </Pill>
          {evid.length > 0 && <Pill tone="info">{evid.length} 项取证</Pill>}
        </Row>
        {cont.length > 0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:4 }}>遏制动作</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {cont.map((a,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, fontSize:11.5, padding:'4px 8px', background:'#fff', border:'1px solid var(--border)', borderRadius:4 }}>
                  <span className="mono"><strong>{a.action}</strong> · {a.target_entity}</span>
                  {a.requires_approval && <Pill tone="warning" style={{ fontSize:10 }}>需审批</Pill>}
                </div>
              ))}
            </div>
          </div>
        )}
        {evid.length > 0 && (
          <div style={{ marginTop:6 }}>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:4 }}>取证</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {evid.map((a,i) => (
                <div key={i} className="mono" style={{ fontSize:11.5, padding:'3px 8px', background:'#fff', border:'1px solid var(--border)', borderRadius:4 }}>
                  {a.action} · {a.target_entity}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Fallback: payload key list ----
  const keys = Object.keys(payload || {});
  return (
    <div style={{ padding:'10px 12px', borderRadius:6, background:'var(--muted-2)', border:'1px solid var(--border)', fontSize:12, color:'var(--muted-foreground)' }}>
      payload 字段：{keys.join(', ') || '空'}（展开下方 JSON 查看完整内容）
    </div>
  );
}

function ArchitectureRow({ icon, title, detail }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'28px 1fr',
      gap:10,
      alignItems:'center',
      padding:'10px 0',
      borderBottom:'1px solid var(--border)',
    }}>
      <div style={{
        width:28, height:28, borderRadius:7,
        background:'var(--muted-2)',
        border:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--muted-foreground)',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize:13, fontWeight:600 }}>{title}</div>
        <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:1 }}>{detail}</div>
      </div>
    </div>
  );
}

function CapabilityFact({ label, value }) {
  return (
    <div style={{
      border:'1px solid var(--border)',
      borderRadius:6,
      padding:'8px 10px',
      background:'var(--muted-2)',
      minWidth:0,
    }}>
      <div style={{ fontSize:11, color:'var(--muted-foreground)', marginBottom:3 }}>{label}</div>
      <div className="mono" style={{ fontSize:12, fontWeight:650, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
    </div>
  );
}

function SourceCoveragePanel({ sources, selectedSources }) {
  const max = Math.max(...sources.map(s => s.count), 1);
  return (
    <UI.Card style={{ padding:18, boxShadow:'none' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:650 }}>数据源覆盖</div>
        <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>{sources.length} 类接入</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {sources.slice(0, 12).map(item => {
          const active = selectedSources.includes(item.source);
          return (
            <div key={item.source} style={{ display:'grid', gridTemplateColumns:'82px 1fr 28px', gap:8, alignItems:'center' }}>
              <span className="mono" style={{
                fontSize:11,
                fontWeight:active ? 750 : 500,
                color:active ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}>{item.source}</span>
              <div style={{ height:7, background:'var(--muted)', borderRadius:999, overflow:'hidden' }}>
                <div style={{
                  width:`${(item.count / max) * 100}%`,
                  height:'100%',
                  borderRadius:999,
                  background:active ? '#0a0a0a' : '#d4d4d8',
                }}/>
              </div>
              <span className="mono" style={{ fontSize:11, textAlign:'right', color:'var(--muted-foreground)' }}>{item.count}</span>
            </div>
          );
        })}
      </div>
    </UI.Card>
  );
}

function CapabilityPipeline({ selected }) {
  const steps = [
    { title:'Core', sub:'Schema / Context / Registry', icon:<Icons.Settings size={14}/>, active:true },
    { title:'DataSource', sub:selected.sources.slice(0, 3).join(' / ') + (selected.sources.length > 3 ? ' / ...' : ''), icon:<Icons.Database size={14}/>, active:selected.sources.some(s => s.startsWith('DS-')) },
    { title:selected.id, sub:selected.name, icon:<Icons.Command size={14}/>, active:true },
    { title:'CapabilityResult', sub:'payload / confidence / evidence', icon:<Icons.Check size={14}/>, active:true },
    { title:'Agent', sub:'下一步 / 判定 / 处置', icon:<Icons.Brain size={14}/>, active:selected.domain === 'G' || selected.domain === 'F' },
  ];
  return (
    <UI.Card style={{ padding:'14px 16px', boxShadow:'none', overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0, 1fr))', gap:10, alignItems:'stretch' }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.title}>
            <div style={{
              minHeight:64,
              border:'1px solid var(--border)',
              borderRadius:7,
              background:step.active ? '#fff' : 'var(--muted-2)',
              padding:'10px 12px',
              display:'flex',
              alignItems:'center',
              gap:10,
              position:'relative',
            }}>
              <div style={{
                width:28, height:28, borderRadius:7,
                background:step.active ? '#0a0a0a' : 'var(--muted)',
                color:step.active ? '#fff' : 'var(--muted-foreground)',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0,
              }}>{step.icon}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:650, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{step.title}</div>
                <div style={{ fontSize:11.5, color:'var(--muted-foreground)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{step.sub}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  position:'absolute',
                  right:-17,
                  top:'50%',
                  transform:'translateY(-50%)',
                  zIndex:2,
                  width:24,
                  height:24,
                  borderRadius:'50%',
                  background:'#fff',
                  border:'1px solid var(--border)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  color:'var(--muted-foreground)',
                }}><Icons.ArrowR size={13}/></div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </UI.Card>
  );
}

/* Settings — 设置 v2: 日志数据源, 删除SLA tab, 删除调查参数 */

const { useState: useStateSet } = React;

const SRC_TYPE_CONFIG = {
  webhook: { label:'Webhook',  iconKey:'Webhook' },
  syslog:  { label:'Syslog',   iconKey:'Server' },
  api:     { label:'API',      iconKey:'Cloud' },
  kafka:   { label:'Kafka',    iconKey:'Database' },
  file:    { label:'文件',     iconKey:'HardDrive' },
};

function SettingsPage() {
  const [tab, setTab] = useStateSet('sources');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <UI.SectionTitle title="系统设置" subtitle="管理数据接入、AI 引擎与存储策略" />
      <UI.Tabs value={tab} onChange={setTab} items={[
        { value:'sources', label:'告警数据源',   icon:<Icons.Alert size={13}/> },
        { value:'logs',    label:'日志数据源',   icon:<Icons.Database size={13}/> },
        { value:'ai',      label:'AI 引擎',      icon:<Icons.Brain size={13}/> },
        { value:'storage', label:'存储',         icon:<Icons.HardDrive size={13}/> },
      ]}/>
      {tab === 'sources' && <AlertSourcesTab/>}
      {tab === 'logs'    && <LogSourcesTab/>}
      {tab === 'ai'      && <AIEngineTab/>}
      {tab === 'storage' && <StorageTab/>}
    </div>
  );
}

/* ─── Alert Sources Tab ─── */
function AlertSourcesTab() {
  const [addOpen, setAddOpen] = useStateSet(false);
  const active   = mockAlertSources.filter(s => s.status === 'active').length;
  const error    = mockAlertSources.filter(s => s.status === 'error').length;
  return (
    <>
      <UI.Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)' }}>
          <SetStat label="数据源总数"   value={mockAlertSources.length} />
          <SetStat label="正常连接"   value={active}   tone="success"/>
          <SetStat label="异常连接"   value={error}    tone="destructive"/>
          <SetStat label="今日告警量" value="21,631"  sub="原始告警条数"/>
        </div>
      </UI.Card>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <div style={{ fontSize:14, fontWeight:600 }}>告警数据源 · {mockAlertSources.length}</div>
        <div style={{ display:'flex', gap:8 }}>
          <UI.Button leftIcon={<Icons.Refresh size={14}/>}>刷新状态</UI.Button>
          <UI.Button variant="brand" leftIcon={<Icons.Plus size={14}/>} onClick={() => setAddOpen(true)}>添加数据源</UI.Button>
        </div>
      </div>

      <UI.Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{
          display:'grid',
          gridTemplateColumns:'1.5fr 100px 100px 130px 130px 90px',
          gap:12, padding:'10px 16px',
          background:'var(--muted-2)', borderBottom:'1px solid var(--border)',
          fontSize:11, color:'var(--muted-foreground)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em',
        }}>
          <span>数据源</span><span>类型</span><span>状态</span><span>最后活动</span><span>告警数量</span><span style={{ textAlign:'right' }}>操作</span>
        </div>
        {mockAlertSources.map((s, i) => <AlertSourceRow key={s.id} source={s} divider={i < mockAlertSources.length - 1}/>)}
      </UI.Card>

      <UI.Modal open={addOpen} onClose={() => setAddOpen(false)} title="添加告警数据源" description="配置新的告警接入源，系统将自动解析和标准化告警数据" width={540}
        footer={<>
          <UI.Button onClick={() => setAddOpen(false)}>取消</UI.Button>
          <UI.Button variant="brand" leftIcon={<Icons.Plus size={13}/>}>添加</UI.Button>
        </>}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <huntHelpers.Field label="数据源名称"><UI.Input placeholder="例如：Proofpoint TAP"/></huntHelpers.Field>
          <huntHelpers.Field label="接入方式">
            <UI.Select value="" onChange={()=>{}} placeholder="选择接入方式"
              options={Object.entries(SRC_TYPE_CONFIG).map(([k,v])=>({value:k, label:v.label}))}/>
          </huntHelpers.Field>
          <huntHelpers.Field label="场景分类">
            <UI.Select value="" onChange={()=>{}} placeholder="选择场景"
              options={Object.entries(SCENE_CONFIG).map(([k,v])=>({value:k, label:v.label}))}/>
          </huntHelpers.Field>
          <huntHelpers.Field label="连接地址"><UI.Input placeholder="https://api.example.com/alerts"/></huntHelpers.Field>
          <huntHelpers.Field label="认证方式">
            <UI.Select value="" onChange={()=>{}} placeholder="选择认证方式" options={[
              { value:'none',  label:'无需认证' },
              { value:'apikey',label:'API Key' },
              { value:'basic', label:'Basic Auth' },
              { value:'oauth', label:'OAuth 2.0' },
            ]}/>
          </huntHelpers.Field>
        </div>
      </UI.Modal>
    </>
  );
}

function AlertSourceRow({ source, divider }) {
  const cfg = SRC_TYPE_CONFIG[source.type];
  const Icon = Icons[cfg.iconKey];
  const statusMeta = {
    active:   { tone:'success', label:'正常' },
    inactive: { tone:'neutral', label:'休眠' },
    error:    { tone:'destructive', label:'异常' },
  }[source.status];

  const fmtRel = (t) => {
    if (!t) return '从未';
    const diff = new Date() - new Date(t);
    const min = Math.floor(diff / 60000), hr = Math.floor(diff / 3600000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min} 分钟前`;
    if (hr < 24) return `${hr} 小时前`;
    return new Date(t).toLocaleDateString('zh-CN');
  };

  return (
    <div className="hover-row" style={{
      display:'grid', gridTemplateColumns:'1.5fr 100px 100px 130px 130px 90px',
      gap:12, padding:'12px 16px', alignItems:'center',
      borderBottom: divider ? '1px solid var(--border)' : 'none',
      transition:'background .12s',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:30, height:30, borderRadius:7,
          background:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon size={15}/>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:500 }}>{source.name}</div>
          <div className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{source.id}</div>
        </div>
      </div>
      <UI.Badge variant="muted">{cfg.label}</UI.Badge>
      <UI.Badge tone={statusMeta.tone}><UI.Dot tone={statusMeta.tone} size={6} pulse={source.status === 'active'}/> {statusMeta.label}</UI.Badge>
      <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>{fmtRel(source.lastSeen)}</span>
      <span className="mono" style={{ fontSize:12.5, fontWeight:500 }}>{source.alertCount.toLocaleString()}</span>
      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
        <UI.Button variant="ghost" size="icon-sm" title="测试连接"><Icons.Activity size={13}/></UI.Button>
        <UI.Button variant="ghost" size="icon-sm" title="编辑"><Icons.Edit size={13}/></UI.Button>
        <UI.Button variant="ghost" size="icon-sm" title={source.status === 'active' ? '暂停' : '启用'}>
          {source.status === 'active' ? <Icons.Pause size={13}/> : <Icons.Play size={13}/>}
        </UI.Button>
      </div>
    </div>
  );
}

/* ─── Log Sources Tab ─── */
function LogSourcesTab() {
  const [addOpen, setAddOpen] = useStateSet(false);
  const active     = mockLogSources.filter(s => s.status === 'active').length;
  const error      = mockLogSources.filter(s => s.status === 'error').length;
  const totalLogs  = mockLogSources.reduce((s, e) => s + e.logCount, 0);

  return (
    <>
      <UI.Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)' }}>
          <SetStat label="日志数据源总数" value={mockLogSources.length} />
          <SetStat label="正常接入"   value={active}   tone="success"/>
          <SetStat label="接入异常"   value={error}    tone="destructive"/>
          <SetStat label="日志总量"   value={`${(totalLogs / 1e6).toFixed(1)}M`} sub="条原始日志"/>
        </div>
      </UI.Card>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600 }}>日志数据源 · {mockLogSources.length}</div>
          <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:2 }}>日志数据源用于 AI 调查时的实体查询和行为分析</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <UI.Button leftIcon={<Icons.Refresh size={14}/>}>刷新状态</UI.Button>
          <UI.Button variant="brand" leftIcon={<Icons.Plus size={14}/>} onClick={() => setAddOpen(true)}>接入日志源</UI.Button>
        </div>
      </div>

      <UI.Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{
          display:'grid',
          gridTemplateColumns:'1.5fr 100px 100px 140px 140px 90px',
          gap:12, padding:'10px 16px',
          background:'var(--muted-2)', borderBottom:'1px solid var(--border)',
          fontSize:11, color:'var(--muted-foreground)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em',
        }}>
          <span>日志数据源</span><span>接入方式</span><span>状态</span><span>最后同步</span><span>日志总量</span><span style={{ textAlign:'right' }}>操作</span>
        </div>
        {mockLogSources.map((s, i) => <LogSourceRow key={s.id} source={s} divider={i < mockLogSources.length - 1}/>)}
      </UI.Card>

      {/* Integration info */}
      <UI.Card style={{ padding:'16px 18px', background:'var(--muted-2)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:'#0a0a0a', color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Icons.Brain size={16}/>
          </div>
          <div>
            <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4 }}>日志数据源如何被使用？</div>
            <div style={{ fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6 }}>
              AI 调查引擎在分析安全事件时，会自动查询日志数据源中的相关记录，包括账号行为日志、网络流量日志和系统事件日志，以还原攻击路径并生成研判结论。日志数据源的完整性直接影响 AI 调查质量。
            </div>
          </div>
        </div>
      </UI.Card>

      <UI.Modal open={addOpen} onClose={() => setAddOpen(false)} title="接入日志数据源" description="配置新的日志接入源，供 AI 调查引擎检索使用" width={540}
        footer={<>
          <UI.Button onClick={() => setAddOpen(false)}>取消</UI.Button>
          <UI.Button variant="brand" leftIcon={<Icons.Plus size={13}/>}>接入</UI.Button>
        </>}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <huntHelpers.Field label="数据源名称"><UI.Input placeholder="例如：Elasticsearch · 安全日志"/></huntHelpers.Field>
          <huntHelpers.Field label="接入类型">
            <UI.Select value="" onChange={()=>{}} placeholder="选择接入类型" options={[
              { value:'elasticsearch', label:'Elasticsearch / OpenSearch' },
              { value:'clickhouse',    label:'ClickHouse' },
              { value:'splunk',        label:'Splunk' },
              { value:'kafka',         label:'Kafka（实时流）' },
              { value:'syslog',        label:'Syslog' },
              { value:'minio',         label:'MinIO / S3（归档）' },
              { value:'loki',          label:'Grafana Loki' },
            ]}/>
          </huntHelpers.Field>
          <huntHelpers.Field label="日志类型">
            <UI.Select value="" onChange={()=>{}} placeholder="选择日志类型" options={[
              { value:'security', label:'安全事件日志' },
              { value:'network',  label:'网络流量日志' },
              { value:'endpoint', label:'终端行为日志' },
              { value:'auth',     label:'认证与访问日志' },
              { value:'app',      label:'应用访问日志' },
              { value:'audit',    label:'合规审计日志' },
            ]}/>
          </huntHelpers.Field>
          <huntHelpers.Field label="连接地址 / 主机"><UI.Input placeholder="https://es.example.com:9200"/></huntHelpers.Field>
          <huntHelpers.Field label="索引 / 数据库" hint="支持通配符，如 security-logs-*"><UI.Input placeholder="security-logs-*"/></huntHelpers.Field>
          <huntHelpers.Field label="认证方式">
            <UI.Select value="" onChange={()=>{}} placeholder="选择认证方式" options={[
              { value:'none',   label:'无需认证' },
              { value:'apikey', label:'API Key' },
              { value:'basic',  label:'Basic Auth' },
              { value:'token',  label:'Bearer Token' },
            ]}/>
          </huntHelpers.Field>
        </div>
      </UI.Modal>
    </>
  );
}

function LogSourceRow({ source, divider }) {
  const typeIconMap = {
    api:    { iconKey:'Cloud',     label:'API' },
    kafka:  { iconKey:'Database',  label:'Kafka' },
    syslog: { iconKey:'Server',    label:'Syslog' },
  };
  const cfg = typeIconMap[source.type] || { iconKey:'Database', label:source.type.toUpperCase() };
  const Icon = Icons[cfg.iconKey];
  const statusMeta = {
    active: { tone:'success',     label:'正常' },
    error:  { tone:'destructive', label:'异常' },
  }[source.status] || { tone:'neutral', label:'未知' };

  const fmtRel = (t) => {
    if (!t) return '从未';
    const diff = new Date() - new Date(t);
    const min = Math.floor(diff / 60000), hr = Math.floor(diff / 3600000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min} 分钟前`;
    if (hr < 24) return `${hr} 小时前`;
    return new Date(t).toLocaleDateString('zh-CN');
  };

  const fmtCount = (n) => {
    if (n >= 1e8) return `${(n / 1e8).toFixed(2)} 亿`;
    if (n >= 1e7) return `${(n / 1e6).toFixed(1)} 百万`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)} M`;
    return n.toLocaleString();
  };

  return (
    <div className="hover-row" style={{
      display:'grid', gridTemplateColumns:'1.5fr 100px 100px 140px 140px 90px',
      gap:12, padding:'12px 16px', alignItems:'center',
      borderBottom: divider ? '1px solid var(--border)' : 'none',
      transition:'background .12s',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:30, height:30, borderRadius:7,
          background: source.status === 'error' ? '#fef2f2' : 'var(--brand-soft)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon size={15} style={{ color: source.status === 'error' ? '#dc2626' : 'var(--brand-emphasis)' }}/>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:500 }}>{source.name}</div>
          <div className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{source.id}</div>
        </div>
      </div>
      <UI.Badge variant="muted">{cfg.label}</UI.Badge>
      <UI.Badge tone={statusMeta.tone}><UI.Dot tone={statusMeta.tone} size={6} pulse={source.status === 'active'}/> {statusMeta.label}</UI.Badge>
      <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>{fmtRel(source.lastSeen)}</span>
      <span className="mono" style={{ fontSize:12.5, fontWeight:500 }}>{fmtCount(source.logCount)}</span>
      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
        <UI.Button variant="ghost" size="icon-sm" title="测试连接"><Icons.Activity size={13}/></UI.Button>
        <UI.Button variant="ghost" size="icon-sm" title="编辑"><Icons.Edit size={13}/></UI.Button>
        <UI.Button variant="ghost" size="icon-sm" title={source.status === 'active' ? '暂停' : '启用'}>
          {source.status === 'active' ? <Icons.Pause size={13}/> : <Icons.Play size={13}/>}
        </UI.Button>
      </div>
    </div>
  );
}

/* ─── AI Engine Tab ─── */
function AIEngineTab() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:4, display:'inline-flex', alignItems:'center', gap:8 }}>
          <Icons.Brain size={15}/> LLM 模型配置
        </div>
        <div style={{ fontSize:12, color:'var(--muted-foreground)', marginBottom:16 }}>选择和配置推理引擎</div>
        <huntHelpers.Field label="LLM 模型" hint="推荐使用 Qwen2.5-72B，中文理解和工具调用能力优秀">
          <UI.Select value="qwen72b" onChange={()=>{}} options={[
            { value:'qwen72b',  label:'Qwen2.5-72B-Instruct（推荐）' },
            { value:'deepseek', label:'DeepSeek-V3' },
            { value:'qwen32b',  label:'Qwen2.5-32B-Instruct' },
          ]}/>
        </huntHelpers.Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14 }}>
          <huntHelpers.Field label="Temperature"><UI.Input defaultValue="0.1"/></huntHelpers.Field>
          <huntHelpers.Field label="Top P"><UI.Input defaultValue="0.9"/></huntHelpers.Field>
        </div>
      </UI.Card>

      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, display:'inline-flex', alignItems:'center', gap:8 }}>
              <Icons.Cpu size={15}/> GPU 资源状态
            </div>
            <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:2 }}>A100-80GB × 4 · vLLM 推理框架</div>
          </div>
          <UI.Badge tone="success"><UI.Dot tone="success" size={6} pulse/> 运行中</UI.Badge>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
              <span style={{ color:'var(--muted-foreground)' }}>GPU 利用率</span>
              <span className="mono" style={{ fontWeight:500 }}>67%</span>
            </div>
            <UI.Progress value={67}/>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
              <span style={{ color:'var(--muted-foreground)' }}>显存占用</span>
              <span className="mono" style={{ fontWeight:500 }}>58GB / 80GB</span>
            </div>
            <UI.Progress value={72.5}/>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
              <span style={{ color:'var(--muted-foreground)' }}>QPS</span>
              <span className="mono" style={{ fontWeight:500 }}>12.4 / 50</span>
            </div>
            <UI.Progress value={24.8}/>
          </div>
        </div>
      </UI.Card>
    </div>
  );
}

/* ─── Storage Tab ─── */
function StorageTab() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:600, display:'inline-flex', alignItems:'center', gap:8 }}>
            <Icons.HardDrive size={15}/> 存储状态概览
          </div>
          <UI.Badge tone="success">健康</UI.Badge>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <StorageBar label="热存储 (Elasticsearch)" used="2.4TB" total="5TB" percent={48} />
          <StorageBar label="温存储 (ClickHouse)" used="18TB" total="50TB" percent={36} />
          <StorageBar label="冷存储 (MinIO)" used="156TB" total="500TB" percent={31.2} />
        </div>
      </UI.Card>

      <UI.Card style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>数据保留策略</div>
        <ParamRow title="热存储保留期" sub="Elasticsearch 高速检索" control={
          <UI.Select value="30" onChange={()=>{}} options={['7','14','30','60'].map(v => ({ value:v, label:`${v} 天` }))} width={100}/>
        }/>
        <ParamRow title="温存储保留期" sub="ClickHouse 聚合分析" control={
          <UI.Select value="180" onChange={()=>{}} options={['90','180','365'].map(v => ({ value:v, label:`${v} 天` }))} width={100}/>
        }/>
        <ParamRow title="冷存储保留期" sub="合规归档存储" control={
          <UI.Select value="730" onChange={()=>{}} options={[
            { value:'365', label:'1 年' }, { value:'730', label:'2 年' }, { value:'1095', label:'3 年' }, { value:'2555', label:'7 年' },
          ]} width={120}/>
        } isLast/>
      </UI.Card>
    </div>
  );
}

/* ─── Shared helpers ─── */
function SetStat({ label, value, sub, tone }) {
  return (
    <div style={{ padding:'14px 18px', borderRight:'1px solid var(--border)' }}>
      <div style={{ fontSize:11.5, color:'var(--muted-foreground)', display:'inline-flex', alignItems:'center', gap:6 }}>
        {tone && <UI.Dot tone={tone} size={6}/>}{label}
      </div>
      <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.02em', marginTop:4, color: tone === 'destructive' ? 'var(--destructive)' : tone === 'success' ? 'var(--success)' : 'var(--foreground)' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted-foreground)', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function ParamRow({ title, sub, control, isLast }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize:13.5, fontWeight:500 }}>{title}</div>
        <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:2 }}>{sub}</div>
      </div>
      <div>{control}</div>
    </div>
  );
}

function StorageBar({ label, used, total, percent }) {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
        <span style={{ color:'var(--muted-foreground)' }}>{label}</span>
        <span className="mono" style={{ fontWeight:500 }}>{used} / {total}</span>
      </div>
      <UI.Progress value={percent}/>
    </div>
  );
}


/* App entrypoint with a Next.js path router. */

function parseRoute(pathname) {
  const cleanPath = (pathname || '/').replace(/^\/+|\/+$/g, '');
  const [page = 'dashboard', ...rest] = cleanPath ? cleanPath.split('/') : ['dashboard'];
  return { page, params: rest };
}

function App() {
  const pathname = usePathname();
  const router = useRouter();
  const route = parseRoute(pathname);

  const navigate = (path) => {
    const cleanPath = String(path || 'dashboard').replace(/^\/+|\/+$/g, '');
    router.push('/' + cleanPath);
  };

  let page = null;
  let breadcrumb = ['工作区'];

  switch (route.page) {
    case 'dashboard':
      page = <DashboardPage onNavigate={navigate}/>;
      breadcrumb = ['工作区', '调查看板'];
      break;
    case 'events':
      if (route.params[0]) {
        const eventId = route.params[0];
        if (route.params[1] === 'action-graph') {
          page = <ActionGraphPage eventId={eventId} onNavigate={navigate}/>;
          breadcrumb = ['工作区', '事件中心', eventId, '处置流程'];
        } else {
          page = <EventDetailPage eventId={eventId} onNavigate={navigate}/>;
          breadcrumb = ['工作区', '事件中心', eventId];
        }
      } else {
        page = <EventsPage onNavigate={navigate}/>;
        breadcrumb = ['工作区', '事件中心'];
      }
      break;
    case 'hunting':
      page = <HuntingPage onNavigate={navigate}/>;
      breadcrumb = ['工作区', '主动狩猎'];
      break;
    case 'atomic-capabilities':
      page = <AtomicCapabilitiesPage />;
      breadcrumb = ['工作区', '能力地图'];
      break;
    case 'knowledge':
      page = <KnowledgePage onNavigate={navigate}/>;
      breadcrumb = ['工作区', '环境上下文'];
      break;
    case 'settings':
      page = <SettingsPage onNavigate={navigate}/>;
      breadcrumb = ['工作区', '设置'];
      break;
    default:
      page = <DashboardPage onNavigate={navigate}/>;
      breadcrumb = ['工作区', '调查看板'];
  }

  // Determine which nav item is current
  const currentNav = route.page === 'events' ? 'events' : route.page;

  return (
    <Shell.AppShell current={currentNav} breadcrumb={breadcrumb} onNavigate={navigate}>
      {page}
    </Shell.AppShell>
  );
}

export default App;
