"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import GameCanvas from "../../components/GameCanvas";
import QRCodeModal from "../../components/QRCodeModal";
import ImageCropModal from "../../components/ImageCropModal";
import { Game, GameDifficulty, BackgroundTheme, BackgroundEffect, ObstacleTheme, CharacterShape } from "../../lib/types";
import { saveGame, getGameByIdOrSlug, DEFAULT_AVATARS, DEFAULT_OBSTACLES } from "../../lib/storage";
import { VoiceRecorder, AudioEngine } from "../../lib/audioEngine";
import { processImageFile, removeColorBackground } from "../../lib/imageProcessor";
import {
  Upload,
  Camera,
  Mic,
  Square,
  Play,
  Save,
  Share2,
  Sparkles,
  Volume2,
  Settings,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  Trash2,
  Wand2,
  ImagePlus,
  Loader2,
  RefreshCw,
  Crop,
} from "lucide-react";

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  // Tabs
  const [activeTab, setActiveTab] = useState<"character" | "background" | "sounds" | "obstacles" | "physics">("character");

  // File Input Refs for direct click reliability
  const characterFileRef = useRef<HTMLInputElement | null>(null);
  const bgFileRef = useRef<HTMLInputElement | null>(null);
  const obstacleFileRef = useRef<HTMLInputElement | null>(null);

  // Upload & processing state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Voice Recorder State
  const [recordingSlot, setRecordingSlot] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const studioAudioRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !studioAudioRef.current) {
      studioAudioRef.current = new AudioEngine();
    }
  }, []);

  // QR Modal & Origin
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [origin, setOrigin] = useState("");

  // Crop Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [cropTarget, setCropTarget] = useState<"obstacle" | "character">("obstacle");

  // Current Game State with deterministic initial values for SSR
  const [game, setGame] = useState<Game>({
    id: "game-new",
    title: "My Custom Flappy Adventure",
    slug: "my-flappy-adventure",
    creatorName: "Player 1",
    description: "Custom game created with my photos and sounds on FlappyVerse!",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    isPublished: false,
    playCount: 0,
    highScore: 0,
    character: {
      name: "Hero",
      imageUrl: DEFAULT_AVATARS.cyberHero,
      scale: 1.0,
      rotation: 0,
      shape: "circle",
      glowColor: "#00f0ff",
    },
    background: {
      theme: "space",
      effects: "stars",
      speed: 1.2,
    },
    sounds: {
      jumpPreset: "boing",
      collisionPreset: "bonk",
      scorePreset: "ding",
      gameoverPreset: "wasted",
      volume: 0.85,
    },
    obstacles: {
      theme: "neon",
      color: "#00f0ff",
      width: 55,
      gap: 135,
      spacing: 110,
    },
    physics: {
      difficulty: "medium",
      speed: 2.4,
      gravity: 0.38,
      jumpForce: 7.0,
    },
  });

  // Load existing game if editing or initialize client-only unique ID & slug
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    if (editId) {
      getGameByIdOrSlug(editId).then((loaded) => {
        if (loaded) {
          setGame(loaded);
        }
      });
    } else {
      setGame((prev) => ({
        ...prev,
        id: `game-${Date.now()}`,
        slug: `my-flappy-${Math.floor(Math.random() * 10000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
  }, [editId]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Character Image Upload Handler (Compressed & High-Speed)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const dataUrl = await processImageFile(file, 600);
        setGame((prev) => ({
          ...prev,
          character: {
            ...prev.character,
            imageUrl: dataUrl,
          },
        }));
        setUploadSuccessMsg("Character photo uploaded successfully!");
        setTimeout(() => setUploadSuccessMsg(null), 3000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to upload image. Please try a different photo.");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    }
  };

  // Background Removal Tool for Character
  const handleRemoveBackground = async () => {
    if (!game.character.imageUrl) return;
    try {
      setIsUploading(true);
      // Remove white/light background with default tolerance
      const transparentUrl = await removeColorBackground(game.character.imageUrl, { r: 255, g: 255, b: 255 }, 45);
      setGame((prev) => ({
        ...prev,
        character: {
          ...prev.character,
          imageUrl: transparentUrl,
        },
      }));
      setUploadSuccessMsg("Background color removed!");
      setTimeout(() => setUploadSuccessMsg(null), 3000);
    } catch {
      alert("Unable to process background removal on this image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Camera Capture
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert("Camera access was denied or is unavailable on this device.");
      setIsCameraActive(false);
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Center crop square
    const video = videoRef.current;
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;

    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 400, 400);
    const photoUrl = canvas.toDataURL("image/png", 0.92);

    setGame((prev) => ({
      ...prev,
      character: {
        ...prev.character,
        imageUrl: photoUrl,
      },
    }));

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsCameraActive(false);
    setUploadSuccessMsg("Selfie photo captured!");
    setTimeout(() => setUploadSuccessMsg(null), 3000);
  };

  // Background Image Upload Handler
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const dataUrl = await processImageFile(file, 800);
        setGame((prev) => ({
          ...prev,
          background: {
            ...prev.background,
            customImageUrl: dataUrl,
          },
        }));
        setUploadSuccessMsg("Background photo uploaded successfully!");
        setTimeout(() => setUploadSuccessMsg(null), 3000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to upload background image.");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    }
  };

  // Obstacle Image Upload Handler - opens cropper immediately for exact pillar fitting
  const handleObstacleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const dataUrl = await processImageFile(file, 800);
        setGame((prev) => ({
          ...prev,
          obstacles: {
            ...prev.obstacles,
            customImageUrl: dataUrl,
          },
        }));
        setImageToCrop(dataUrl);
        setCropTarget("obstacle");
        setCropModalOpen(true);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to upload obstacle image.");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    if (cropTarget === "obstacle") {
      setGame((prev) => ({
        ...prev,
        obstacles: {
          ...prev.obstacles,
          customImageUrl: croppedUrl,
        },
      }));
      setUploadSuccessMsg("Obstacle image cropped & applied as full pillar!");
    } else {
      setGame((prev) => ({
        ...prev,
        character: {
          ...prev.character,
          imageUrl: croppedUrl,
        },
      }));
      setUploadSuccessMsg("Character photo cropped and applied!");
    }
    setTimeout(() => setUploadSuccessMsg(null), 3000);
  };

  // Sound File Upload Handler
  const handleSoundUpload = (slot: "jumpUrl" | "collisionUrl" | "scoreUrl" | "gameoverUrl", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGame((prev) => ({
          ...prev,
          sounds: {
            ...prev.sounds,
            [slot]: reader.result as string,
          },
        }));
        setUploadSuccessMsg("Audio file uploaded!");
        setTimeout(() => setUploadSuccessMsg(null), 3000);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  // Voice Recording Handlers
  const startRecordingVoice = async (slot: "jumpUrl" | "collisionUrl" | "scoreUrl" | "gameoverUrl") => {
    try {
      voiceRecorderRef.current = new VoiceRecorder();
      await voiceRecorderRef.current.startRecording();
      setRecordingSlot(slot);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert("Microphone permission required to record your voice.");
    }
  };

  const stopRecordingVoice = async (slot: "jumpUrl" | "collisionUrl" | "scoreUrl" | "gameoverUrl") => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!voiceRecorderRef.current) return;

    try {
      const { dataUrl } = await voiceRecorderRef.current.stopRecording();
      setGame((prev) => ({
        ...prev,
        sounds: {
          ...prev.sounds,
          [slot]: dataUrl,
        },
      }));
      setUploadSuccessMsg("Voice clip recorded and attached!");
      setTimeout(() => setUploadSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setRecordingSlot(null);
      setRecordingSeconds(0);
    }
  };

  // Zero-latency Sound Player for Studio Preview
  const playSoundPreview = (url?: string) => {
    if (!url || !studioAudioRef.current) return;
    studioAudioRef.current.setVolume(game.sounds.volume || 0.85);
    studioAudioRef.current.preloadAudio(url).then((buf) => {
      if (buf && studioAudioRef.current) {
        studioAudioRef.current.playBuffer(buf);
      }
    });
  };

  const playPresetPreview = (presetKey: string, presetName: string) => {
    if (!studioAudioRef.current) return;
    studioAudioRef.current.setVolume(game.sounds.volume || 0.85);
    if (presetKey === "jumpPreset") studioAudioRef.current.playJump(undefined, presetName);
    else if (presetKey === "collisionPreset") studioAudioRef.current.playCollision(undefined, presetName);
    else if (presetKey === "scorePreset") studioAudioRef.current.playScore(undefined, presetName);
    else if (presetKey === "gameoverPreset") studioAudioRef.current.playGameOver(undefined, presetName);
  };

  // Preset Difficulty changer
  const applyDifficulty = (diff: GameDifficulty) => {
    if (diff === "easy") {
      setGame((prev) => ({
        ...prev,
        physics: { difficulty: "easy", speed: 2.1, gravity: 0.34, jumpForce: 6.8 },
        obstacles: { ...prev.obstacles, gap: 150, spacing: 125 },
      }));
    } else if (diff === "medium") {
      setGame((prev) => ({
        ...prev,
        physics: { difficulty: "medium", speed: 2.5, gravity: 0.38, jumpForce: 7.2 },
        obstacles: { ...prev.obstacles, gap: 135, spacing: 110 },
      }));
    } else if (diff === "hard") {
      setGame((prev) => ({
        ...prev,
        physics: { difficulty: "hard", speed: 3.1, gravity: 0.44, jumpForce: 7.6 },
        obstacles: { ...prev.obstacles, gap: 120, spacing: 95 },
      }));
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    await saveGame(game);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Publish Game
  const handlePublish = async () => {
    const publishedGame = {
      ...game,
      isPublished: true,
    };
    await saveGame(publishedGame);
    setGame(publishedGame);
    setShowShareModal(true);
  };

  const shareUrl = origin ? `${origin}/play/${game.slug || game.id}` : "";

  return (
    <div className="min-h-screen bg-[#060618] text-slate-100 flex flex-col">
      <Navbar />

      {/* Upload Success Toast Alert */}
      {uploadSuccessMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          {uploadSuccessMsg}
        </div>
      )}

      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-3" />
          <p className="font-bold text-sm tracking-wider text-cyan-300">OPTIMIZING MEDIA...</p>
        </div>
      )}

      {/* Studio Banner & Top Control */}
      <div className="border-b border-purple-900/30 bg-[#090924] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <input
              type="text"
              value={game.title}
              onChange={(e) =>
                setGame((prev) => ({
                  ...prev,
                  title: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"),
                }))
              }
              className="text-xl sm:text-2xl font-black bg-transparent text-cyan-300 border-b border-cyan-500/40 hover:border-cyan-400 focus:border-cyan-300 outline-none w-full max-w-lg transition-colors"
              placeholder="Enter Game Title..."
            />
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span>Creator:</span>
              <input
                type="text"
                value={game.creatorName}
                onChange={(e) => setGame((prev) => ({ ...prev, creatorName: e.target.value }))}
                className="bg-slate-900/60 border border-slate-700 rounded px-2 py-0.5 text-slate-200 outline-none w-28 text-xs font-semibold"
              />
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-purple-300 font-mono">/play/{game.slug}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold text-xs sm:text-sm text-slate-200 shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              {savedSuccess ? "Saved!" : "Save Draft"}
            </button>
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 rounded-xl font-black text-xs sm:text-sm text-white shadow-[0_0_20px_rgba(255,0,127,0.5)] transition-all transform hover:scale-105 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Publish Game
            </button>
          </div>
        </div>
      </div>

      {/* Studio Workspace */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Customization Tabs & Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
            {[
              { id: "character", label: "Character Photo", icon: Camera },
              { id: "background", label: "Background", icon: ImageIcon },
              { id: "sounds", label: "Voice & Sounds", icon: Volume2 },
              { id: "obstacles", label: "Obstacles & Media", icon: Sliders },
              { id: "physics", label: "Physics & Speed", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/30 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                      : "bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: CHARACTER STUDIO */}
          {activeTab === "character" && (
            <div className="bg-[#0a0a2f] border border-cyan-500/20 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-cyan-400 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-400" />
                  Character Studio: Use Real Photos!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Upload a photo of yourself, a friend, or your pet to transform them into the flying arcade hero.
                </p>
              </div>

              {/* Current Character Active Card */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl gap-4 shadow-inner">
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-20 h-20 rounded-full overflow-hidden p-1 shadow-lg shrink-0"
                    style={{
                      border: `3px solid ${game.character.glowColor || "#00f0ff"}`,
                      boxShadow: `0 0 20px ${game.character.glowColor || "#00f0ff"}66`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={game.character.imageUrl}
                      alt="Active Character"
                      className="w-full h-full object-cover rounded-full bg-slate-950"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                      ✓ Active Hero Character
                    </span>
                    <h4 className="font-black text-base text-slate-100 mt-1">
                      {game.character.name || "Hero"}
                    </h4>
                    <p className="text-xs text-slate-400">Scale: {game.character.scale}x • Shape: {game.character.shape}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      if (game.character.imageUrl) {
                        setImageToCrop(game.character.imageUrl);
                        setCropTarget("character");
                        setCropModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-300 text-xs font-bold rounded-xl transition-all"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    Crop Photo
                  </button>
                  <button
                    onClick={handleRemoveBackground}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-300 text-xs font-bold rounded-xl transition-all"
                    title="Make white/solid backgrounds transparent"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Auto Cutout / Remove BG
                  </button>
                  <button
                    onClick={() =>
                      setGame((prev) => ({
                        ...prev,
                        character: { ...prev.character, imageUrl: DEFAULT_AVATARS.cyberHero },
                      }))
                    }
                    className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                    title="Reset to default cyber avatar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload & Camera Trigger Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => characterFileRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 bg-slate-900/80 hover:bg-slate-800/80 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl cursor-pointer transition-all group"
                >
                  <Upload className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform mb-2" />
                  <span className="font-bold text-sm text-cyan-300">Upload Photo</span>
                  <span className="text-xs text-slate-400 mt-1">Select from Phone Gallery or PC</span>
                </button>
                <input
                  ref={characterFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 bg-slate-900/80 hover:bg-slate-800/80 border-2 border-dashed border-pink-500/40 hover:border-pink-400 rounded-xl transition-all group"
                >
                  <Camera className="w-8 h-8 text-pink-400 group-hover:scale-110 transition-transform mb-2" />
                  <span className="font-bold text-sm text-pink-300">Take Photo</span>
                  <span className="text-xs text-slate-400 mt-1">Use Device Camera / Selfie</span>
                </button>
              </div>

              {/* Camera Live Viewfinder */}
              {isCameraActive && (
                <div className="p-4 bg-slate-950 border border-pink-500/50 rounded-xl flex flex-col items-center gap-3">
                  <video ref={videoRef} autoPlay playsInline className="w-64 h-64 object-cover rounded-full border-4 border-pink-500 shadow-2xl" />
                  <div className="flex gap-3">
                    <button
                      onClick={captureCameraPhoto}
                      className="px-5 py-2 bg-pink-500 hover:bg-pink-400 text-white font-bold text-sm rounded-full shadow-lg transition-transform active:scale-95"
                    >
                      📸 Snap Photo
                    </button>
                    <button
                      onClick={() => {
                        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
                        setIsCameraActive(false);
                      }}
                      className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-sm rounded-full"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Preset Avatars */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Or Pick a Preset Template:
                </label>
                <div className="flex gap-4">
                  {Object.entries(DEFAULT_AVATARS).map(([key, svg]) => (
                    <button
                      key={key}
                      onClick={() => setGame((prev) => ({ ...prev, character: { ...prev.character, imageUrl: svg } }))}
                      className="p-1 rounded-full border-2 border-slate-700 hover:border-cyan-400 transition-all hover:scale-105"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={svg} alt={key} className="w-12 h-12 rounded-full" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Character Fine-Tuning Controls */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Character Scale</span>
                    <span className="text-cyan-400 font-mono">{game.character.scale}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.05"
                    value={game.character.scale}
                    onChange={(e) =>
                      setGame((prev) => ({
                        ...prev,
                        character: { ...prev.character, scale: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Aura Glow Color:
                  </label>
                  <div className="flex gap-3">
                    {["#00f0ff", "#ff007f", "#9d00ff", "#ffeb3b", "#00ff88"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setGame((prev) => ({ ...prev, character: { ...prev.character, glowColor: c } }))}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          game.character.glowColor === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c, boxShadow: `0 0 10px ${c}` }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Cutout Shape:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["circle", "neon-glow"] as CharacterShape[]).map((shape) => (
                      <button
                        key={shape}
                        onClick={() => setGame((prev) => ({ ...prev, character: { ...prev.character, shape } }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${
                          game.character.shape === shape
                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                            : "border-slate-800 bg-slate-900 text-slate-400"
                        }`}
                      >
                        {shape.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKGROUND STUDIO */}
          {activeTab === "background" && (
            <div className="bg-[#0a0a2f] border border-cyan-500/20 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-cyan-400 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  Background Studio: Choose or Upload!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Upload a personal landscape photo or pick from our built-in parallax themes.
                </p>
              </div>

              {/* Upload Custom Background */}
              <button
                type="button"
                onClick={() => bgFileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center p-6 bg-slate-900/80 hover:bg-slate-800/80 border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-xl cursor-pointer transition-all group"
              >
                <Upload className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="font-bold text-sm text-purple-300">Upload Custom Background Image</span>
                <span className="text-xs text-slate-400 mt-1">Photos of your room, city, vacation, etc.</span>
              </button>
              <input
                ref={bgFileRef}
                type="file"
                accept="image/*"
                onChange={handleBgUpload}
                className="hidden"
              />

              {game.background.customImageUrl && (
                <div className="flex items-center justify-between p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={game.background.customImageUrl}
                      alt="Custom Background"
                      className="w-14 h-10 object-cover rounded-lg border border-purple-400"
                    />
                    <span className="text-xs font-semibold text-purple-300">✓ Custom Background Active</span>
                  </div>
                  <button
                    onClick={() => setGame((prev) => ({ ...prev, background: { ...prev.background, customImageUrl: undefined } }))}
                    className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              )}

              {/* Preset Themes Grid */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Preset Multiverse Themes:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: "space", label: "Space Cyber", bg: "from-blue-950 to-purple-950" },
                    { id: "city", label: "Neon City", bg: "from-indigo-950 to-slate-900" },
                    { id: "sunset", label: "Sunset Dusk", bg: "from-purple-900 to-orange-950" },
                    { id: "mountains", label: "Mountains", bg: "from-slate-900 to-teal-950" },
                    { id: "beach", label: "Beach Tropics", bg: "from-sky-900 to-yellow-950" },
                    { id: "night", label: "Deep Night", bg: "from-black to-blue-950" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setGame((prev) => ({
                          ...prev,
                          background: { ...prev.background, theme: t.id as BackgroundTheme, customImageUrl: undefined },
                        }))
                      }
                      className={`p-3 rounded-xl border text-center font-bold text-xs bg-gradient-to-b ${t.bg} transition-all ${
                        game.background.theme === t.id && !game.background.customImageUrl
                          ? "border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg"
                          : "border-slate-800 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather / Ambient Effects */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Atmospheric Ambient Effects:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "stars", label: "✨ Stars" },
                    { id: "rain", label: "🌧️ Neon Rain" },
                    { id: "snow", label: "❄️ Snow" },
                    { id: "none", label: "🚫 None" },
                  ].map((eff) => (
                    <button
                      key={eff.id}
                      onClick={() =>
                        setGame((prev) => ({
                          ...prev,
                          background: { ...prev.background, effects: eff.id as BackgroundEffect },
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        game.background.effects === eff.id
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                          : "border-slate-800 bg-slate-900 text-slate-400"
                      }`}
                    >
                      {eff.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOUND STUDIO */}
          {activeTab === "sounds" && (
            <div className="bg-[#0a0a2f] border border-cyan-500/20 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-cyan-400 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-yellow-400" />
                  Sound Studio: Voice & Personal Audio!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Record funny voice clips or upload sound files for jumping, hitting pipes, scoring, and game over!
                </p>
              </div>

              {/* 4 Sound Slots */}
              {[
                {
                  id: "jumpUrl",
                  label: "1. Jump Sound (Play when flying)",
                  desc: "Record a funny 'Wheee!', 'Boing!', or whistle",
                  url: game.sounds.jumpUrl,
                  presetKey: "jumpPreset",
                  presets: ["boing", "flappy", "laser", "wheee", "pop"],
                },
                {
                  id: "collisionUrl",
                  label: "2. Crash Sound (Play when hitting obstacle)",
                  desc: "Record an 'Ouch!', 'Bonk!', or screaming sound",
                  url: game.sounds.collisionUrl,
                  presetKey: "collisionPreset",
                  presets: ["bonk", "oof", "explosion"],
                },
                {
                  id: "scoreUrl",
                  label: "3. Score Sound (Play when passing pipe)",
                  desc: "Record a 'Nice!', 'Point!', or chime",
                  url: game.sounds.scoreUrl,
                  presetKey: "scorePreset",
                  presets: ["ding", "chime", "arcade"],
                },
                {
                  id: "gameoverUrl",
                  label: "4. Game Over Sound (Play on game end)",
                  desc: "Record a 'Wasted!', 'Game Over!', or sad laugh",
                  url: game.sounds.gameoverUrl,
                  presetKey: "gameoverPreset",
                  presets: ["wasted", "dramatic"],
                },
              ].map((slot) => {
                const isRecordingThis = recordingSlot === slot.id;
                const slotKey = slot.id as "jumpUrl" | "collisionUrl" | "scoreUrl" | "gameoverUrl";

                return (
                  <div key={slot.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-bold text-sm text-cyan-300">{slot.label}</span>
                        <p className="text-xs text-slate-400">{slot.desc}</p>
                      </div>
                      {slot.url && (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 shrink-0">
                          ✓ Custom Audio Loaded
                        </span>
                      )}
                    </div>

                    {/* Controls row: Record, Upload, Test */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Live Mic Recorder */}
                      {isRecordingThis ? (
                        <button
                          onClick={() => stopRecordingVoice(slotKey)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg animate-pulse shadow-md"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          Stop Recording ({recordingSeconds}s)
                        </button>
                      ) : (
                        <button
                          onClick={() => startRecordingVoice(slotKey)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/50 text-pink-300 font-bold text-xs rounded-lg transition-all"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          Record Voice
                        </button>
                      )}

                      {/* File Upload */}
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-lg cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        Upload Audio
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleSoundUpload(slotKey, e)}
                          className="hidden"
                        />
                      </label>

                      {/* Test Player Button */}
                      {slot.url && (
                        <button
                          onClick={() => playSoundPreview(slot.url)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-lg transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Play Audio
                        </button>
                      )}

                      {/* Remove Custom Sound */}
                      {slot.url && (
                        <button
                          onClick={() =>
                            setGame((prev) => ({
                              ...prev,
                              sounds: { ...prev.sounds, [slotKey]: undefined },
                            }))
                          }
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 ml-auto"
                          title="Reset to default synthesizer sound"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Built-in Preset Sounds with Instant Preview */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
                      {slot.presets.map((presetName) => {
                        const currentPreset = game.sounds[slot.presetKey as keyof typeof game.sounds];
                        const isSelected = currentPreset === presetName;
                        return (
                          <button
                            key={presetName}
                            type="button"
                            onClick={() => {
                              setGame((prev) => ({
                                ...prev,
                                sounds: {
                                  ...prev.sounds,
                                  [slot.presetKey]: presetName,
                                },
                              }));
                              playPresetPreview(slot.presetKey, presetName);
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                              isSelected
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500"
                            }`}
                          >
                            {isSelected ? "▶ " : ""}{presetName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Master Volume Slider */}
              <div className="pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Sound Volume</span>
                  <span className="text-cyan-400 font-mono">{Math.round((game.sounds.volume || 0.8) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={game.sounds.volume}
                  onChange={(e) =>
                    setGame((prev) => ({
                      ...prev,
                      sounds: { ...prev.sounds, volume: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: OBSTACLE STUDIO (CUSTOM MEDIA & PILLARS) */}
          {activeTab === "obstacles" && (
            <div className="bg-[#0a0a2f] border border-cyan-500/20 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-cyan-400 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Obstacle Studio: Custom Media & Image Obstacles!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Keep any image, photo, or meme as the obstacles your character must dodge!
                </p>
              </div>

              {/* Custom Image Obstacle Upload Card */}
              <div className="p-5 bg-slate-900/90 border border-cyan-500/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-pink-400" />
                    Keep An Image As Obstacles
                  </span>
                  {game.obstacles.customImageUrl && (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                      ✓ Custom Image Obstacle Active
                    </span>
                  )}
                </div>

                {/* Upload Trigger Button */}
                <button
                  type="button"
                  onClick={() => obstacleFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 p-5 bg-gradient-to-r from-purple-950/60 to-slate-900 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl transition-all group cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="block font-bold text-sm text-cyan-300">Upload Your Own Image / Media</span>
                    <span className="block text-xs text-slate-400">Photos of friends, memes, food, logos, or icons</span>
                  </div>
                </button>
                <input
                  ref={obstacleFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleObstacleUpload}
                  className="hidden"
                />

                {/* Preset Obstacle Media Library */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Or Pick an Obstacle from Media Library:
                  </label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {[
                      { key: "rocket", label: "Rocket", img: DEFAULT_OBSTACLES.rocket },
                      { key: "burger", label: "Burger", img: DEFAULT_OBSTACLES.burger },
                      { key: "crystal", label: "Crystal", img: DEFAULT_OBSTACLES.crystal },
                      { key: "skull", label: "Skull", img: DEFAULT_OBSTACLES.skull },
                      { key: "cactus", label: "Cactus", img: DEFAULT_OBSTACLES.cactus },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() =>
                          setGame((prev) => ({
                            ...prev,
                            obstacles: { ...prev.obstacles, customImageUrl: item.img },
                          }))
                        }
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                          game.obstacles.customImageUrl === item.img
                            ? "border-cyan-400 bg-cyan-500/20 scale-105 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.img} alt={item.label} className="w-8 h-8 object-contain mb-1" />
                        <span className="text-[10px] font-bold text-slate-300">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Obstacle Preview & Reset Button */}
                {game.obstacles.customImageUrl && (
                  <div className="flex items-center justify-between p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={game.obstacles.customImageUrl}
                        alt="Active Obstacle"
                        className="w-10 h-10 object-contain rounded-lg border border-cyan-400 bg-slate-950 p-1"
                      />
                      <span className="text-xs font-semibold text-purple-300">
                        Image is active on all obstacle columns
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (game.obstacles.customImageUrl) {
                            setImageToCrop(game.obstacles.customImageUrl);
                            setCropTarget("obstacle");
                            setCropModalOpen(true);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-lg transition-all"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        Crop / Adjust
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setGame((prev) => ({
                            ...prev,
                            obstacles: { ...prev.obstacles, customImageUrl: undefined },
                          }))
                        }
                        className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revert
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Obstacle Themes & Colors */}
              {!game.obstacles.customImageUrl && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    Pillar Style Theme:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "neon", label: "Neon Pillars" },
                      { id: "crystals", label: "Crystal Spikes" },
                      { id: "classic", label: "Classic Pipes" },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() =>
                          setGame((prev) => ({
                            ...prev,
                            obstacles: { ...prev.obstacles, theme: theme.id as ObstacleTheme },
                          }))
                        }
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                          game.obstacles.theme === theme.id
                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                            : "border-slate-800 bg-slate-900 text-slate-400"
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Obstacle Color Picker */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Obstacle Neon Accent Color:
                </label>
                <div className="flex gap-3">
                  {["#00f0ff", "#ff007f", "#9d00ff", "#22c55e", "#f59e0b"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setGame((prev) => ({ ...prev, obstacles: { ...prev.obstacles, color: c } }))}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        game.obstacles.color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c, boxShadow: `0 0 10px ${c}` }}
                    />
                  ))}
                </div>
              </div>

              {/* Sliders: Gap & Width */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Vertical Gap (Passage Space)</span>
                    <span className="text-cyan-400 font-mono">{game.obstacles.gap}px</span>
                  </div>
                  <input
                    type="range"
                    min="105"
                    max="175"
                    step="5"
                    value={game.obstacles.gap}
                    onChange={(e) =>
                      setGame((prev) => ({
                        ...prev,
                        obstacles: { ...prev.obstacles, gap: parseInt(e.target.value) },
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Tighter (Harder)</span>
                    <span>Wider (Easier)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Pillar Width</span>
                    <span className="text-cyan-400 font-mono">{game.obstacles.width}px</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="80"
                    step="2"
                    value={game.obstacles.width}
                    onChange={(e) =>
                      setGame((prev) => ({
                        ...prev,
                        obstacles: { ...prev.obstacles, width: parseInt(e.target.value) },
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PHYSICS & SETTINGS */}
          {activeTab === "physics" && (
            <div className="bg-[#0a0a2f] border border-cyan-500/20 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-cyan-400 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Physics, Gravity & Difficulty
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Adjust how the character flies, falls, and responds to taps.
                </p>
              </div>

              {/* Difficulty Presets */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Quick Difficulty Presets:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "easy", label: "Casual (Easy)", desc: "Gentle speed & wide gaps" },
                    { id: "medium", label: "Arcade (Medium)", desc: "Balanced standard" },
                    { id: "hard", label: "Hardcore (Hard)", desc: "High velocity challenge" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyDifficulty(p.id as GameDifficulty)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        game.physics.difficulty === p.id
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md"
                          : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-slate-100">{p.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fine Tuning Sliders */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Flight Speed</span>
                    <span className="text-cyan-400 font-mono">{game.physics.speed}</span>
                  </div>
                  <input
                    type="range"
                    min="1.6"
                    max="4.0"
                    step="0.1"
                    value={game.physics.speed}
                    onChange={(e) =>
                      setGame((prev) => ({
                        ...prev,
                        physics: { ...prev.physics, speed: parseFloat(e.target.value), difficulty: "custom" },
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Gravity (Downward Pull)</span>
                    <span className="text-cyan-400 font-mono">{game.physics.gravity}</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="0.55"
                    step="0.02"
                    value={game.physics.gravity}
                    onChange={(e) =>
                      setGame((prev) => ({
                        ...prev,
                        physics: { ...prev.physics, gravity: parseFloat(e.target.value), difficulty: "custom" },
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Jump Strength (Flap Impulse)</span>
                    <span className="text-cyan-400 font-mono">{game.physics.jumpForce}</span>
                  </div>
                  <input
                    type="range"
                    min="5.5"
                    max="8.8"
                    step="0.2"
                    value={game.physics.jumpForce}
                    onChange={(e) =>
                      setGame((prev) => ({
                        ...prev,
                        physics: { ...prev.physics, jumpForce: parseFloat(e.target.value), difficulty: "custom" },
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Interactive Game Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full flex flex-col items-center">
            <div className="flex items-center justify-between w-full max-w-sm mb-3">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-pink-400" />
                Live Interactive Preview
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Real-time update</span>
            </div>

            {/* Canvas Player Embedded */}
            <GameCanvas game={game} width={380} height={520} />

            <p className="text-xs text-slate-400 mt-3 text-center max-w-xs">
              Test your game directly right here! Tap or press Space to verify character size, sounds, and custom obstacles.
            </p>
          </div>
        </div>
      </div>

      {/* Share / Publish Modal */}
      <QRCodeModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        gameTitle={game.title}
        shareUrl={shareUrl}
      />

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageUrl={imageToCrop}
        onCropComplete={handleCropComplete}
        title={cropTarget === "obstacle" ? "Crop Obstacle Pillar Image" : "Crop Character Photo"}
        defaultAspect={cropTarget === "obstacle" ? "pillar" : "square"}
      />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060618] text-white flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
