"use client";

import Link from "next/link";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  Home,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  ShoppingBag,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/providers/app-provider";
import { PersistentImage, PersistentVideo } from "@/components/ui/persistent-media";
import { formatCompact, formatMoney, uid } from "@/lib/utils";
import { EMPTY_REEL_PROFILE, rankReels, recordPreference, type ReelPreferenceProfile } from "@/lib/reels/recommendation";
import { getReelSessionId } from "@/lib/reels/session";
import { merchantStoreHref } from "@/lib/store-website";
import { getProductsByIds, insertReelComment, loadReelComments, recordReelView } from "@/lib/supabase/repository";
import type { Reel } from "@/types";

type ReelComment = {
  id: string;
  reelId: string;
  userName: string;
  avatar: string;
  text: string;
  createdAt: string;
  likes: number;
};

type SocialState = {
  savedIds: string[];
  followedStoreIds: string[];
  hiddenIds: string[];
  likedCommentIds: string[];
  comments: ReelComment[];
};

const SOCIAL_STORAGE_KEY = "tijvorya-reels-social-v2";
const RECOMMENDATION_STORAGE_KEY = "tijvorya-reels-preferences-v1";

const initialComments: ReelComment[] = [];

function useReelSocial() {
  const emptySocial: SocialState = { savedIds: [], followedStoreIds: [], hiddenIds: [], likedCommentIds: [], comments: initialComments };
  const [social, setSocial] = useState<SocialState>(emptySocial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SOCIAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SocialState>;
        setSocial({
          savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : [],
          followedStoreIds: Array.isArray(parsed.followedStoreIds) ? parsed.followedStoreIds : [],
          hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
          likedCommentIds: Array.isArray(parsed.likedCommentIds) ? parsed.likedCommentIds : [],
          comments: Array.isArray(parsed.comments) ? parsed.comments : initialComments,
        });
      }
    } catch {
      setSocial(emptySocial);
    } finally {
      setLoaded(true);
    }
  // The empty shape is intentionally fixed for the lifetime of the hook.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(social));
  }, [social, loaded]);

  return {
    social,
    toggleSave: (reelId: string) => setSocial((previous) => ({
      ...previous,
      savedIds: previous.savedIds.includes(reelId)
        ? previous.savedIds.filter((id) => id !== reelId)
        : [...previous.savedIds, reelId],
    })),
    toggleFollow: (storeId: string) => setSocial((previous) => ({
      ...previous,
      followedStoreIds: previous.followedStoreIds.includes(storeId)
        ? previous.followedStoreIds.filter((id) => id !== storeId)
        : [...previous.followedStoreIds, storeId],
    })),
    hideReel: (reelId: string) => setSocial((previous) => ({ ...previous, hiddenIds: previous.hiddenIds.includes(reelId) ? previous.hiddenIds : [...previous.hiddenIds, reelId] })),
    toggleCommentLike: (commentId: string) => setSocial((previous) => {
      const liked = previous.likedCommentIds.includes(commentId);
      return {
        ...previous,
        likedCommentIds: liked ? previous.likedCommentIds.filter((id) => id !== commentId) : [...previous.likedCommentIds, commentId],
        comments: previous.comments.map((comment) => comment.id === commentId ? { ...comment, likes: Math.max(0, comment.likes + (liked ? -1 : 1)) } : comment),
      };
    }),
    addComment: (comment: ReelComment) => setSocial((previous) => ({ ...previous, comments: [...previous.comments, comment] })),
  };
}

function timeAgo(value: string, locale: "ar" | "en") {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 60) return locale === "ar" ? `منذ ${diffMinutes} د` : `${diffMinutes}m`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h`;
  const days = Math.round(hours / 24);
  return locale === "ar" ? `منذ ${days} ي` : `${days}d`;
}

function ReelItem({
  reel,
  active,
  soundOn,
  saved,
  following,
  commentCount,
  onToggleSound,
  onToggleSave,
  onToggleFollow,
  onOpenComments,
  onHide,
}: {
  reel: Reel;
  active: boolean;
  soundOn: boolean;
  saved: boolean;
  following: boolean;
  commentCount: number;
  onToggleSound: () => void;
  onToggleSave: () => void;
  onToggleFollow: () => void;
  onOpenComments: () => void;
  onHide: () => void;
}) {
  const { locale, products, stores, currentUser, productionMode, addToCart, likedReelIds, toggleLikeReel, toast } = useApp();
  const product = products.find((item) => item.id === reel.productId && item.status === "active");
  const store = stores.find((item) => item.id === reel.storeId && (item.status ?? "active") === "active");
  // This component still renders (and its hooks still run) on the render where
  // product/store haven't loaded yet - it just returns null below instead of the
  // real <video>. mediaReady lets the autoplay effect re-run once that <video>
  // actually mounts; without it, a ref going from null to a real node isn't a
  // dependency change, so an effect gated only on [active, soundOn] never gets a
  // second chance to attach once the element exists.
  const mediaReady = Boolean(product && store);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const liked = likedReelIds.includes(reel.id);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !soundOn;
    if (active) {
      // HLS sources attach asynchronously (hls.js loads via dynamic import, then
      // fetches its manifest/segments), so the video may have no source yet on this
      // first attempt, or may simply not be buffered enough - retry rather than
      // leaving playback stuck after a silently rejected/no-op play() call. Kept
      // as defense-in-depth alongside the mediaReady dependency below, which fixes
      // the actual root cause (this effect getting no second chance to run once
      // the video element itself first becomes available).
      const tryPlay = () => { if (!video.paused) return; video.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); };
      tryPlay();
      video.addEventListener("canplay", tryPlay);
      const poll = window.setInterval(() => {
        if (!video.paused || video.error) { window.clearInterval(poll); return; }
        tryPlay();
      }, 300);
      return () => {
        video.removeEventListener("canplay", tryPlay);
        window.clearInterval(poll);
      };
    }
    video.pause();
  }, [active, soundOn, mediaReady]);

  // Counts a view once this reel has actually held the active slot for a
  // couple of seconds, not the instant it scrolls into view - a quick
  // scroll-past shouldn't count as a watch. Dedup itself lives in the
  // database (reel_events_view_dedup_session_uidx/_user_uidx), so this only
  // needs to fire the request; a repeat from the same session/user is a
  // harmless no-op on the server.
  useEffect(() => {
    if (!active || !productionMode) return;
    const timer = window.setTimeout(() => {
      recordReelView(reel.id, getReelSessionId(), currentUser?.id).catch(() => {});
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [active, productionMode, reel.id, currentUser?.id]);

  useEffect(() => () => {
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().then(() => setPlaying(true)).catch(() => undefined);
    else { video.pause(); setPlaying(false); }
  }, []);

  const handleVideoTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      if (!liked) toggleLikeReel(reel.id);
      setShowHeart(true);
      window.setTimeout(() => setShowHeart(false), 750);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    singleTapTimerRef.current = setTimeout(togglePlayback, 290);
  };

  if (!product || !store) return null;
  const caption = locale === "ar" ? reel.caption : reel.captionEn;

  const share = async () => {
    const url = `${window.location.origin}/${locale}/reels?reel=${reel.id}`;
    try {
      if (navigator.share) await navigator.share({ title: store.name, text: caption, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(locale === "ar" ? "تم نسخ رابط الريلز" : "Reel link copied");
      }
    } catch {
      // Native share may be dismissed by the user.
    }
  };

  return <article className={`reel-slide ${active ? "is-active" : ""}`} data-reel-id={reel.id}>
    <div className="reel-video-shell" onPointerUp={handleVideoTap}>
      <PersistentVideo
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.cover}
        muted={!soundOn}
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
        }}
      />
      <div className="reel-shade" />
      <div className="reel-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      {!playing && <span className="reel-center-play" aria-hidden="true"><Play fill="currentColor" /></span>}
      {showHeart && <span className="reel-like-burst" aria-hidden="true"><Heart fill="currentColor" /></span>}
    </div>

    <div className="reel-video-controls">
      <button onClick={(event) => { event.stopPropagation(); onToggleSound(); }} aria-label={soundOn ? "mute" : "unmute"}>
        {soundOn ? <Volume2 /> : <VolumeX />}
      </button>
      <button onClick={(event) => { event.stopPropagation(); togglePlayback(); }} aria-label={playing ? "pause" : "play"}>
        {playing ? <Pause /> : <Play />}
      </button>
    </div>

    <div className="reel-actions" onPointerUp={(event) => event.stopPropagation()}>
      <div className="reel-avatar-action">
        <Link href={merchantStoreHref(store.slug, locale)} className="reel-action-avatar">
          <PersistentImage className="media-cover" src={store.logo} alt={locale === "ar" ? store.name : store.nameEn} optimized width={48} height={48} />
        </Link>
        <button className={`reel-follow-mini ${following ? "is-following" : ""}`} onClick={onToggleFollow} aria-label={following ? "unfollow" : "follow"}>
          {following ? "✓" : <Plus />}
        </button>
      </div>
      <button className={liked ? "is-active" : ""} onClick={() => toggleLikeReel(reel.id)}>
        <span className="reel-action-icon"><Heart fill={liked ? "currentColor" : "none"}/></span>
        <span>{formatCompact(reel.likes, locale)}</span>
      </button>
      <button onClick={onOpenComments}>
        <span className="reel-action-icon"><MessageCircle /></span>
        <span>{formatCompact(commentCount, locale)}</span>
      </button>
      <button onClick={share}>
        <span className="reel-action-icon"><Share2 /></span>
        <span>{locale === "ar" ? "مشاركة" : "Share"}</span>
      </button>
      <button className={saved ? "is-saved" : ""} onClick={onToggleSave}>
        <span className="reel-action-icon"><Bookmark fill={saved ? "currentColor" : "none"}/></span>
        <span>{locale === "ar" ? "حفظ" : "Save"}</span>
      </button>
      <div className="reel-more-wrap">
        <button onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen} aria-label={locale === "ar" ? "خيارات الريلز" : "Reel options"}>
          <span className="reel-action-icon"><MoreHorizontal /></span>
        </button>
        {moreOpen && <div className="reel-more-menu"><button type="button" onClick={() => { setMoreOpen(false); onHide(); toast(locale === "ar" ? "تم إخفاء الريلز من خلاصتك" : "Reel hidden from your feed", "info"); }}>{locale === "ar" ? "إخفاء هذا الريلز" : "Hide this reel"}</button><button type="button" onClick={() => setMoreOpen(false)}>{locale === "ar" ? "إلغاء" : "Cancel"}</button></div>}
      </div>
    </div>

    <div className="reel-content" onPointerUp={(event) => event.stopPropagation()}>
      <div className="reel-store-row">
        <Link href={merchantStoreHref(store.slug, locale)}>
          <strong>{locale === "ar" ? store.name : store.nameEn}{store.verified && <span className="verified-dot">✓</span>}</strong>
        </Link>
        <button className={`reel-follow-button ${following ? "is-following" : ""}`} onClick={onToggleFollow}>
          {following ? (locale === "ar" ? "تتابعه" : "Following") : (locale === "ar" ? "متابعة" : "Follow")}
        </button>
      </div>
      <p className={expanded ? "is-expanded" : ""}>
        {caption} <button className="reel-caption-more" onClick={() => setExpanded((value) => !value)}>{expanded ? (locale === "ar" ? "أقل" : "less") : (locale === "ar" ? "المزيد" : "more")}</button>
      </p>
      <div className="reel-audio-line"><Music2 /><span>{locale === "ar" ? `الصوت الأصلي · ${store.name}` : `Original audio · ${store.nameEn}`}</span></div>
      <div className="reel-product-panel">
        <Link href={`/${locale}/product/${product.id}`}>
          <div className="reel-product-image"><PersistentImage className="media-fill" src={product.image} alt="" optimized sizes="44px" /></div>
          <div><small>{locale === "ar" ? "تسوّق هذا المنتج" : "Shop this product"}</small><strong>{locale === "ar" ? product.name : product.nameEn}</strong><span>{formatMoney(product.price, locale)}</span></div>
        </Link>
        <button className="reel-shop-button" onClick={() => addToCart(product.id)}><ShoppingBag />{locale === "ar" ? "إضافة" : "Add"}</button>
      </div>
    </div>
  </article>;
}

function CommentsSheet({
  reel,
  comments,
  loading,
  canComment,
  onClose,
  onAdd,
  likedCommentIds,
  onToggleCommentLike,
}: {
  reel: Reel;
  comments: ReelComment[];
  loading: boolean;
  canComment: boolean;
  onClose: () => void;
  onAdd: (comment: ReelComment) => void;
  likedCommentIds: string[];
  onToggleCommentLike: (commentId: string) => void;
}) {
  const { locale, currentUser } = useApp();
  const [text, setText] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || !canComment) return;
    onAdd({
      id: uid("reel-comment"),
      reelId: reel.id,
      userName: currentUser?.fullName ?? (locale === "ar" ? "زائر Tijvorya" : "Tijvorya guest"),
      avatar: currentUser?.avatar ?? "TJ",
      text: value,
      createdAt: new Date().toISOString(),
      likes: 0,
    });
    setText("");
  };

  return <div className="reel-comments-backdrop" onMouseDown={onClose}>
    <aside className="reel-comments-sheet" onMouseDown={(event) => event.stopPropagation()}>
      <header>
        <strong>{locale === "ar" ? `التعليقات (${comments.length})` : `Comments (${comments.length})`}</strong>
        <button onClick={onClose} aria-label="close"><X /></button>
      </header>
      <div className="reel-comments-list">
        {loading ? <div className="reel-comments-empty"><MessageCircle /><p>{locale === "ar" ? "جارٍ تحميل التعليقات..." : "Loading comments..."}</p></div> : comments.length ? comments.map((comment) => <article key={comment.id} className="reel-comment">
          <span className="reel-comment-avatar">{comment.avatar}</span>
          <div><strong>{comment.userName}</strong><p>{comment.text}</p><small>{timeAgo(comment.createdAt, locale)} · {locale === "ar" ? "رد" : "Reply"}</small></div>
          <button className={likedCommentIds.includes(comment.id) ? "is-active" : ""} onClick={() => onToggleCommentLike(comment.id)} aria-label={locale === "ar" ? "إعجاب بالتعليق" : "Like comment"}><Heart fill={likedCommentIds.includes(comment.id) ? "currentColor" : "none"} /><small>{comment.likes || ""}</small></button>
        </article>) : <div className="reel-comments-empty"><MessageCircle /><strong>{locale === "ar" ? "ابدأ المحادثة" : "Start the conversation"}</strong><p>{locale === "ar" ? "كن أول من يعلّق على هذا الريلز." : "Be the first to comment on this reel."}</p></div>}
      </div>
      {canComment ? <form onSubmit={submit} className="reel-comment-form">
        <span className="reel-comment-avatar">{currentUser?.avatar ?? "TJ"}</span>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder={locale === "ar" ? "أضف تعليقًا..." : "Add a comment..."} maxLength={280} />
        <button type="submit" disabled={!text.trim()}><Send /></button>
      </form> : <div className="reel-comments-empty">{locale === "ar" ? "سجّل الدخول لإضافة تعليق." : "Sign in to add a comment."}</div>}
    </aside>
  </div>;
}

export function ReelFeed({ reels }: { reels: Reel[] }) {
  const { locale, products, productionMode, currentUser, toast, mergeProducts } = useApp();
  const { social, toggleSave, toggleFollow, hideReel, toggleCommentLike, addComment } = useReelSocial();
  // Real comments (production mode) are loaded per-reel on demand when the
  // sheet opens, not all upfront - demo mode keeps the existing localStorage
  // comments from useReelSocial above unchanged.
  const [remoteComments, setRemoteComments] = useState<Record<string, ReelComment[]>>({});

  // Reels resolve their product from the shared cache (see ReelItem/recordPreference
  // below) - batch-fetch whatever this feed's reels reference that isn't cached yet,
  // instead of each reel silently rendering without its product.
  useEffect(() => {
    if (!productionMode) return;
    const knownIds = new Set(products.map((product) => product.id));
    const missingIds = Array.from(new Set(reels.map((reel) => reel.productId).filter((id) => !knownIds.has(id))));
    if (missingIds.length === 0) return;
    let active = true;
    getProductsByIds(missingIds).then((resolved) => { if (active) mergeProducts(resolved); }).catch(console.error);
    return () => { active = false; };
  }, [reels, products, productionMode, mergeProducts]);
  const feedRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(reels[0]?.id ?? "");
  const [soundOn, setSoundOn] = useState(false);
  const [tab, setTab] = useState<"for-you" | "following">("for-you");
  const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ReelPreferenceProfile>(EMPTY_REEL_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(RECOMMENDATION_STORAGE_KEY) ?? "{}") as Partial<ReelPreferenceProfile>;
      setProfile({ ...EMPTY_REEL_PROFILE, ...parsed } as ReelPreferenceProfile);
    } catch {
      setProfile(EMPTY_REEL_PROFILE);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (profileLoaded) window.localStorage.setItem(RECOMMENDATION_STORAGE_KEY, JSON.stringify(profile));
  }, [profile, profileLoaded]);

  const personalizedReels = useMemo(() => rankReels(reels, products, profile), [reels, products, profile]);
  const visibleReels = useMemo(() => {
    const visible = personalizedReels.filter((reel) => !social.hiddenIds.includes(reel.id));
    return tab === "following" ? visible.filter((reel) => social.followedStoreIds.includes(reel.storeId)) : visible;
  }, [personalizedReels, social.followedStoreIds, social.hiddenIds, tab]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const items = Array.from(feed.querySelectorAll<HTMLElement>("[data-reel-id]"));
    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (mostVisible?.target instanceof HTMLElement) {
        const reelId = mostVisible.target.dataset.reelId ?? "";
        setActiveId(reelId);
        const reel = reels.find((item) => item.id === reelId);
        if (reel) setProfile((current) => recordPreference(current, { reel, product: products.find((item) => item.id === reel.productId), signal: "view" }));
      }
    }, { root: feed, threshold: [0.55, 0.75, 0.95] });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [visibleReels, reels, products]);

  const resolvedActiveId = visibleReels.some((reel) => reel.id === activeId) ? activeId : (visibleReels[0]?.id ?? "");

  const move = useCallback((direction: 1 | -1) => {
    const currentIndex = Math.max(0, visibleReels.findIndex((reel) => reel.id === resolvedActiveId));
    const nextIndex = Math.min(visibleReels.length - 1, Math.max(0, currentIndex + direction));
    feedRef.current?.querySelector<HTMLElement>(`[data-reel-id="${visibleReels[nextIndex]?.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [resolvedActiveId, visibleReels]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") { event.preventDefault(); move(1); }
      if (event.key === "ArrowUp" || event.key === "PageUp") { event.preventDefault(); move(-1); }
      if (event.key.toLowerCase() === "m") setSoundOn((value) => !value);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const selectedReel = reels.find((reel) => reel.id === commentsReelId) ?? null;

  useEffect(() => {
    if (!productionMode || !commentsReelId || remoteComments[commentsReelId]) return;
    let active = true;
    loadReelComments(commentsReelId)
      .then((loaded) => { if (active) setRemoteComments((previous) => ({ ...previous, [commentsReelId]: loaded })); })
      .catch(() => { if (active) toast(locale === "ar" ? "تعذر تحميل التعليقات" : "Unable to load comments", "error"); });
    return () => { active = false; };
  }, [productionMode, commentsReelId, remoteComments, locale, toast]);

  const canComment = !productionMode || Boolean(currentUser);

  const handleAddComment = useCallback((comment: ReelComment) => {
    if (!productionMode) { addComment(comment); return; }
    if (!currentUser) return;
    setRemoteComments((previous) => ({ ...previous, [comment.reelId]: [...(previous[comment.reelId] ?? []), comment] }));
    insertReelComment({
      id: comment.id, reelId: comment.reelId, userId: currentUser.id,
      authorName: comment.userName, authorAvatar: typeof currentUser.avatar === "string" ? currentUser.avatar : undefined, text: comment.text,
    }).catch(() => {
      setRemoteComments((previous) => ({ ...previous, [comment.reelId]: (previous[comment.reelId] ?? []).filter((item) => item.id !== comment.id) }));
      toast(locale === "ar" ? "تعذر إرسال التعليق" : "Unable to post the comment", "error");
    });
  }, [productionMode, currentUser, addComment, locale, toast]);

  return <div className="instagram-reels-shell">
    <div className="reels-topbar">
      <Link className="reels-top-logo" href={`/${locale}`}><PersistentImage src="/assets/tijvorya-mark-official.png" alt="Tijvorya" optimized width={38} height={38} /></Link>
      <div className="reels-tabs" role="tablist">
        <button className={tab === "for-you" ? "is-active" : ""} onClick={() => setTab("for-you")}>{locale === "ar" ? "لك" : "For you"}</button>
        <button className={tab === "following" ? "is-active" : ""} onClick={() => setTab("following")}>{locale === "ar" ? "المتابَعة" : "Following"}</button>
      </div>
      <Link className="reels-close-link" href={`/${locale}`} aria-label="close"><X /></Link>
    </div>

    {visibleReels.length ? <div ref={feedRef} className="reel-feed">
      {visibleReels.map((reel) => <ReelItem
        key={reel.id}
        reel={reel}
        active={reel.id === resolvedActiveId}
        soundOn={soundOn}
        saved={social.savedIds.includes(reel.id)}
        following={social.followedStoreIds.includes(reel.storeId)}
        commentCount={productionMode ? (reel.commentsCount ?? 0) : social.comments.filter((comment) => comment.reelId === reel.id).length}
        onToggleSound={() => setSoundOn((value) => !value)}
        onToggleSave={() => { toggleSave(reel.id); setProfile((current) => recordPreference(current, { reel, product: products.find((item) => item.id === reel.productId), signal: "save" })); }}
        onToggleFollow={() => { toggleFollow(reel.storeId); setProfile((current) => recordPreference(current, { reel, product: products.find((item) => item.id === reel.productId), signal: "follow" })); }}
        onOpenComments={() => setCommentsReelId(reel.id)}
        onHide={() => hideReel(reel.id)}
      />)}
    </div> : <div className="reels-following-empty">
      <UserRound />
      <h2>{locale === "ar" ? "لا تتابع أي متجر بعد" : "You are not following any stores yet"}</h2>
      <p>{locale === "ar" ? "انتقل إلى تبويب «لك» واضغط متابعة على المتاجر التي تعجبك." : "Go to For you and follow stores you like."}</p>
      <button onClick={() => setTab("for-you")}>{locale === "ar" ? "استكشاف الريلز" : "Explore reels"}</button>
    </div>}

    <div className="reels-desktop-nav" aria-label="reel navigation">
      <button onClick={() => move(-1)}><ChevronUp /></button>
      <button onClick={() => move(1)}><ChevronDown /></button>
      <small>{locale === "ar" ? "استخدم ↑ ↓ للتنقل" : "Use ↑ ↓ to navigate"}</small>
    </div>

    <nav className="reels-mobile-nav">
      <Link href={`/${locale}`}><Home /><span>{locale === "ar" ? "الرئيسية" : "Home"}</span></Link>
      <Link href={`/${locale}/marketplace`}><Search /><span>{locale === "ar" ? "بحث" : "Search"}</span></Link>
      <Link href={`/${locale}/merchant/reels/new`}><span className="reels-create-icon"><Plus /></span></Link>
      <Link className="is-active" href={`/${locale}/reels`}><Play /><span>{locale === "ar" ? "ريلز" : "Reels"}</span></Link>
      <Link href={`/${locale}/account`}><UserRound /><span>{locale === "ar" ? "حسابي" : "Profile"}</span></Link>
    </nav>

    {selectedReel && <CommentsSheet
      reel={selectedReel}
      comments={productionMode ? (remoteComments[selectedReel.id] ?? []) : social.comments.filter((comment) => comment.reelId === selectedReel.id)}
      loading={productionMode && !remoteComments[selectedReel.id]}
      canComment={canComment}
      onClose={() => setCommentsReelId(null)}
      onAdd={handleAddComment}
      likedCommentIds={social.likedCommentIds}
      onToggleCommentLike={toggleCommentLike}
    />}
  </div>;
}
