/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║            BUTRU — CENTRALIZED APP CONFIGURATION                ║
 * ║  WHITE-LABEL GUIDE: This is the ONLY file you need to change    ║
 * ║  when deploying a new branded client from this boilerplate.     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Steps for a new client:
 *   1. Duplicate the project.
 *   2. Edit this file (colors, fonts, appName, logo, API endpoints).
 *   3. Build → fully branded app in minutes.
 *
 * DO NOT add any hardcoded color/style values in individual screen files.
 * All style tokens must be referenced through the theme system (useAppTheme).
 */

import type { AppConfig } from '../theme/types';
import { FONTS } from '../constants/fonts';

const APP_CONFIG: AppConfig = {
  // ── Identity ────────────────────────────────────────────────────────
  appName: 'Butru',
  logoUrl: null, // e.g. 'https://cdn.butru.in/logo.png' for remote, or null to use SVG
  fontFamily: {
    regular: FONTS.arimoRegular ?? 'System',
    bold: FONTS.arimoBold ?? 'System',
    medium: FONTS.poppinsMedium ?? 'System',
    heading: FONTS.inter28Bold ?? 'System',
  },

  // ── Default colour mode ─────────────────────────────────────────────
  // 'light' | 'dark' | 'system'
  defaultMode: 'light',

  // ── Colour Palettes ──────────────────────────────────────────────────
  colors: {
    light: {
      // Core brand
      primary: '#B12B5B',
      primaryLight: '#FCE8F0',
      secondary: '#FF6B35',
      hrsbacroundc:"#F8FAFC",
      hiconbackround :"#FBCFE8B2",
      hisemibackound:"#FFF9FC",
      helptextprcolor:"#64748B",

      // Surfaces
      background: '#FEDDE5',
      backgroundColor: '#F9F3F4', // alias — backward compat for unmigrated screens
      surface: '#FFFFFF',
      surfaceVariant: '#F5F5F5',
      coupanBackroun:"#FFE4ED",

      // Text
      text: '#1A1A1A',
      textSecondary: '#767575',
      textMuted: '#8E8E93',
      textOnPrimary: '#FFFFFF',

      // UI chrome
      border: '#E8E8E8',
      borderFocus: '#C0185A',
      divider: '#F0F0F0',

      // Semantic
      success: '#2ECC71',
      error: '#E74C3C',
      warning: '#FF6B35',
      star: '#FFB800',
      discount: '#00875A',

      // Navigation
      tabActive: '#C0185A',
      tabInactive: '#999999',

      // Misc
      notifDot: '#EF466F',
      overlay: 'rgba(0,0,0,0.4)',
      shimmer: '#E0E0E0',
    },

    dark: {
      // Core brand (stays vivid on dark bg)
      primary: '#E8457C',
      primaryLight: '#3A0F22',
      secondary: '#FF8A5C',

      // Surfaces
      background: '#0D0D0D',
      backgroundColor: '#0D0D0D', // alias — backward compat for unmigrated screens
      surface: '#1C1C1E',
      surfaceVariant: '#2C2C2E',
      coupanBackroun: '#3A0F22',

      // Text
      text: '#F2F2F7',
      textSecondary: '#AEAEB2',
      textMuted: '#636366',
      textOnPrimary: '#FFFFFF',

      // UI chrome
      border: '#3A3A3C',
      borderFocus: '#E8457C',
      divider: '#2C2C2E',

      // Semantic
      success: '#30D158',
      error: '#FF453A',
      warning: '#FF9F0A',
      star: '#FFD60A',
      discount: '#34C759',

      // Navigation
      tabActive: '#E8457C',
      tabInactive: '#636366',

      // Misc
      notifDot: '#FF453A',
      overlay: 'rgba(0,0,0,0.65)',
      shimmer: '#2C2C2E',
    },
  },

  // ── API / Network Configuration ──────────────────────────────────────
  // Note: BASE_URL is still read from .env for security.
  // These headers identify the white-label store tenant.
  api: {
    storeSlug: 'butru-store',
    storeDomain: 'butru.in',
    storeId: '6a20248bf77d663ca797ce90',
  },

  // ── Support / Help & Support ─────────────────────────────────────────────────
  support: {
    phone: '8128013130',
    email: 'hellobutru@gmail.com',
    responseTime: '2-4 HRS',
    companyName: 'BUTRU',
    address: 'J-811/9F, STELLAR ONE, Sector 1, Greater Noida, Uttar Pradesh 201308',
    mapQuery: 'STELLAR ONE, Sector 1, Greater Noida, Uttar Pradesh 201308',
    supportEndpoint: '/api/support', // POST { name, email, message }
  },
};

export default APP_CONFIG;
