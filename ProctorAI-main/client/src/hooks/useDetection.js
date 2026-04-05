import { useEffect, useRef, useState } from "react";

const POINTS = {
  no_face: 8,
  multiple_faces: 15,
  gaze_away: 5,
  phone_detected: 20,
  book_detected: 12,
  tab_switch: 10,
  fullscreen_exit: 8,
  window_blur: 6,
  copy: 6,
  cut: 6,
  paste: 8,
  context_menu: 4,
};

export function useDetection({
  videoRef,
  active,
  preload = false,
  maxViolationsAllowed,
  onViolation,
  onForceSubmit,
  onStatus,
}) {
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [detectorStatus, setDetectorStatus] = useState("initializing");
  const awayStreak = useRef(0);
  const modelsRef = useRef({
    ready: false,
    faceMesh: null,
    objectDetector: null,
    cocoModel: null,
    faceMode: "none",
    objectMode: "none",
  });
  const frameCanvasRef = useRef(document.createElement("canvas"));
  const snapshotCanvasRef = useRef(document.createElement("canvas"));
  const loadingRef = useRef(false);
  const lastViolationAtRef = useRef({});
  const detectionTickRef = useRef(0);
  const recentObjectHitRef = useRef({ phone: 0, book: 0 });
  const retryTimeoutRef = useRef(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const hasObjectModel = Boolean(
      modelsRef.current.objectDetector || modelsRef.current.cocoModel,
    );
    if (!(active || preload) || loadingRef.current || hasObjectModel) return;

    loadingRef.current = true;
    setDetectorStatus("loading");
    onStatus?.("loading");

    async function loadModels() {
      let faceMode = "none";
      let objectMode = "none";
      let faceMeshInstance = null;
      let faceMeshDetector = null;
      let objectDetector = null;
      let cocoModel = null;

      try {
        const faceMeshModule = await import("@mediapipe/face_mesh");
        faceMeshInstance = new faceMeshModule.FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMeshInstance.setOptions({
          maxNumFaces: 2,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        let pendingResolve = null;
        faceMeshInstance.onResults((results) => {
          if (!pendingResolve) return;
          const resolve = pendingResolve;
          pendingResolve = null;

          const faces = (results.multiFaceLandmarks || []).map((lm) =>
            landmarksToFaceBox(lm, videoRef.current),
          );
          resolve(faces);
        });

        faceMeshDetector = {
          detect: async (video) => {
            return new Promise((resolve) => {
              let resolved = false;
              pendingResolve = (faces) => {
                if (resolved) return;
                resolved = true;
                resolve(faces);
              };

              faceMeshInstance.send({ image: video }).catch(() => {
                if (!resolved) {
                  resolved = true;
                  pendingResolve = null;
                  resolve([]);
                }
              });

              window.setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  pendingResolve = null;
                  resolve([]);
                }
              }, 1200);
            });
          },
        };

        faceMode = "mediapipe";
      } catch (_error) {
        faceMeshInstance = null;
        faceMeshDetector = null;
        faceMode = "none";
      }

      try {
        const { pipeline, env } = await import("@xenova/transformers");

        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        env.useBrowserCache = true;

        objectDetector = await pipeline("object-detection", "Xenova/yolov8s");
        objectMode = "yolov8s";
      } catch (_error) {
        objectDetector = null;
        objectMode = "none";
      }

      // Reliability fallback: keep a second object model path active.
      try {
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();
        try {
          await tf.setBackend("webgl");
        } catch (_backendError) {
          await tf.setBackend("cpu");
        }
        await tf.ready();
        cocoModel = await cocoSsd.load();
        objectMode = objectMode === "none" ? "coco-ssd" : `${objectMode}+coco`;
      } catch (_error) {
        cocoModel = null;
      }

      modelsRef.current = {
        ready: Boolean(faceMeshDetector || objectDetector || cocoModel),
        faceMesh: faceMeshDetector,
        objectDetector,
        cocoModel,
        faceMode,
        objectMode,
      };

      const status =
        faceMode === "none" && objectMode === "none"
          ? "degraded"
          : `face:${faceMode}|object:${objectMode}`;
      setDetectorStatus(status);
      onStatus?.(status);

      if (!objectDetector && !cocoModel) {
        retryTimeoutRef.current = window.setTimeout(() => {
          loadingRef.current = false;
          setDetectorStatus("retrying");
          onStatus?.("retrying");
          setRetryTick((value) => value + 1);
        }, 5000);
      }
    }

    loadModels().finally(() => {
      loadingRef.current = false;
    });

    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [active, preload, onStatus, retryTick]);

  useEffect(() => {
    if (!active) return undefined;

    const visibilityHandler = () => {
      if (document.hidden) logViolation("tab_switch", "medium");
    };

    const blurHandler = () => {
      logViolation("window_blur", "medium");
    };

    const focusHandler = () => {
      // Intentionally no-op: focus returning is not a violation.
    };

    const copyHandler = () => {
      logViolation("copy", "low");
    };

    const cutHandler = () => {
      logViolation("cut", "low");
    };

    const pasteHandler = () => {
      logViolation("paste", "medium");
    };

    const contextMenuHandler = (event) => {
      event.preventDefault();
      logViolation("context_menu", "low");
    };

    const fullscreenHandler = () => {
      if (!document.fullscreenElement)
        logViolation("fullscreen_exit", "medium");
    };

    document.addEventListener("visibilitychange", visibilityHandler);
    document.addEventListener("fullscreenchange", fullscreenHandler);
    window.addEventListener("blur", blurHandler);
    window.addEventListener("focus", focusHandler);
    window.addEventListener("copy", copyHandler);
    window.addEventListener("cut", cutHandler);
    window.addEventListener("paste", pasteHandler);
    document.addEventListener("contextmenu", contextMenuHandler);

    return () => {
      document.removeEventListener("visibilitychange", visibilityHandler);
      document.removeEventListener("fullscreenchange", fullscreenHandler);
      window.removeEventListener("blur", blurHandler);
      window.removeEventListener("focus", focusHandler);
      window.removeEventListener("copy", copyHandler);
      window.removeEventListener("cut", cutHandler);
      window.removeEventListener("paste", pasteHandler);
      document.removeEventListener("contextmenu", contextMenuHandler);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;

    const loopId = window.setInterval(() => {
      runDetectionCycle().catch(() => null);
    }, 1200);

    const decayId = window.setInterval(() => {
      setSuspicionScore((prev) => Math.max(0, prev - 1));
    }, 30000);

    return () => {
      window.clearInterval(loopId);
      window.clearInterval(decayId);
    };
  }, [active]);

  async function runDetectionCycle() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return;
    }

    if (modelsRef.current.ready) {
      await runFaceAndObjectDetection(video);
      return;
    }

    // If models are still loading/unavailable, rely only on tab/fullscreen checks.
  }

  async function runFaceAndObjectDetection(video) {
    const { objectDetector, cocoModel, faceMesh, faceMode, objectMode } =
      modelsRef.current;
    const faces = await detectFaces(faceMesh, faceMode, video);
    const faceCount = faces.length;

    if (faceCount === 0) {
      logViolation("no_face", "high", "", video);
    } else {
      const firstFace = faces[0];
      const isOffCenter = isFaceLookingAway(firstFace, faceMode, video);

      if (isOffCenter) {
        awayStreak.current += 1;
        if (awayStreak.current >= 2) {
          logViolation("gaze_away", "low", "", video);
          awayStreak.current = 0;
        }
      } else {
        awayStreak.current = 0;
      }
    }

    if (faceCount > 1) {
      logViolation("multiple_faces", "high", "", video);
    }

    const shouldRunObjectDetection =
      detectionTickRef.current % 1 === 0 ||
      recentObjectHitRef.current.phone > 0 ||
      recentObjectHitRef.current.book > 0;
    detectionTickRef.current += 1;

    let phoneDetectedNow = false;
    let bookDetectedNow = false;
    let phoneSnapshotNow = "";
    let bookSnapshotNow = "";

    if (!shouldRunObjectDetection) {
      return;
    }

    const frame = getFrameCapture(video);

    if (objectDetector && frame?.imageData) {
      try {
        const yoloPredictions = await objectDetector(frame.imageData, {
          threshold: 0.05,
          topk: 30,
        });

        const normalizedYolo = normalizeObjectPredictions(yoloPredictions);
        const phoneMatch = normalizedYolo.find(
          (item) => isPhoneLabel(item.label) && item.score >= 0.04,
        );
        const bookMatch = normalizedYolo.find(
          (item) => isBookLabel(item.label) && item.score >= 0.03,
        );

        if (phoneMatch) {
          phoneDetectedNow = true;
          phoneSnapshotNow = captureSnapshot(video);
        }
        if (bookMatch) {
          bookDetectedNow = true;
          bookSnapshotNow = captureSnapshot(video);
        }
      } catch (_error) {
        setDetectorStatus("partial_error_object:yolo");
        onStatus?.("partial_error_object:yolo");
      }
    }

    if (cocoModel && frame?.canvas) {
      try {
        const cocoPredictions = await cocoModel.detect(frame.canvas);
        const normalizedCoco = normalizeObjectPredictions(cocoPredictions);
        
        if (!phoneDetectedNow) {
          const phoneMatch = normalizedCoco.find(
            (item) => isPhoneLabel(item.label) && item.score >= 0.05,
          );
          if (phoneMatch) {
            phoneDetectedNow = true;
            phoneSnapshotNow = captureSnapshot(video);
          }
        }

        if (!bookDetectedNow) {
          const bookMatch = normalizedCoco.find(
            (item) => isBookLabel(item.label) && item.score >= 0.04,
          );
          if (bookMatch) {
            bookDetectedNow = true;
            bookSnapshotNow = captureSnapshot(video);
          }
        }
      } catch (_error) {
        if (!objectDetector) {
          setDetectorStatus("partial_error_object:coco");
          onStatus?.("partial_error_object:coco");
        }
      }
    }

    const now = Date.now();
    if (phoneDetectedNow) {
      recentObjectHitRef.current.phone = now;
    }
    if (bookDetectedNow) {
      recentObjectHitRef.current.book = now;
    }

    const phoneDetected = now - recentObjectHitRef.current.phone < 3000;
    const bookDetected = now - recentObjectHitRef.current.book < 3000;

    if (phoneDetected) {
      logViolation("phone_detected", "high", phoneSnapshotNow || "", video);
    }

    if (bookDetected) {
      logViolation("book_detected", "medium", bookSnapshotNow || "", video);
    }
  }

  function isFaceLookingAway(face, faceMode, video) {
    if (faceMode === "mediapipe" && Array.isArray(face.landmarks)) {
      const lm = face.landmarks;
      const nose = lm[1];
      const leftEyeOuter = lm[33];
      const leftEyeInner = lm[133];
      const rightEyeInner = lm[362];
      const rightEyeOuter = lm[263];

      if (
        !nose ||
        !leftEyeOuter ||
        !leftEyeInner ||
        !rightEyeInner ||
        !rightEyeOuter
      ) {
        return false;
      }

      const eyeCenterX =
        (leftEyeOuter.x + leftEyeInner.x + rightEyeInner.x + rightEyeOuter.x) /
        4;
      const eyeWidth = Math.max(
        0.001,
        Math.abs(rightEyeOuter.x - leftEyeOuter.x),
      );
      const noseOffsetRatio = Math.abs(nose.x - eyeCenterX) / eyeWidth;

      const leftIris = lm[468];
      const rightIris = lm[473];
      const leftIrisShift =
        leftIris && leftEyeInner && leftEyeOuter
          ? Math.abs(leftIris.x - (leftEyeOuter.x + leftEyeInner.x) / 2) /
            Math.max(0.001, Math.abs(leftEyeInner.x - leftEyeOuter.x))
          : 0;
      const rightIrisShift =
        rightIris && rightEyeInner && rightEyeOuter
          ? Math.abs(rightIris.x - (rightEyeOuter.x + rightEyeInner.x) / 2) /
            Math.max(0.001, Math.abs(rightEyeOuter.x - rightEyeInner.x))
          : 0;

      const leftNoseGap = Math.abs(nose.x - leftEyeOuter.x);
      const rightNoseGap = Math.abs(rightEyeOuter.x - nose.x);
      const turnRatio =
        Math.max(leftNoseGap, rightNoseGap) /
        Math.max(0.001, Math.min(leftNoseGap, rightNoseGap));

      const faceCenterY = (face.topLeft?.[1] + face.bottomRight?.[1]) / 2;
      const headTooLow = faceCenterY > (video.videoHeight || 1) * 0.72;
      const headTooHigh = faceCenterY < (video.videoHeight || 1) * 0.22;

      return (
        noseOffsetRatio > 0.15 ||
        turnRatio > 1.3 ||
        leftIrisShift > 0.2 ||
        rightIrisShift > 0.2 ||
        headTooLow ||
        headTooHigh
      );
    }

    const topLeft = face.topLeft || [0, 0];
    const bottomRight = face.bottomRight || [0, 0];
    const centerX = (topLeft[0] + bottomRight[0]) / 2;
    const w = video.videoWidth || 1;
    return centerX < w * 0.18 || centerX > w * 0.82;
  }

  async function detectFaces(faceMesh, faceMode, video) {
    if (!faceMesh) return [];

    try {
      if (faceMode === "mediapipe") {
        return await faceMesh.detect(video);
      }

      return [];
    } catch (_error) {
      setDetectorStatus("partial_error");
      onStatus?.("partial_error");
      return [];
    }
  }

  function landmarksToFaceBox(landmarks, video) {
    const xs = landmarks.map((point) => point.x);
    const ys = landmarks.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      topLeft: [
        minX * (video?.videoWidth || 1),
        minY * (video?.videoHeight || 1),
      ],
      bottomRight: [
        maxX * (video?.videoWidth || 1),
        maxY * (video?.videoHeight || 1),
      ],
      landmarks,
    };
  }

  function normalizeLabel(label) {
    return String(label || "")
      .trim()
      .toLowerCase();
  }

  function isPhoneLabel(label) {
    const normalized = normalizeLabel(label);
    return (
      normalized === "cell phone" ||
      normalized === "cell_phone" ||
      normalized === "mobile phone" ||
      normalized === "mobile_phone" ||
      normalized === "phone" ||
      normalized === "smartphone" ||
      normalized === "mobile" ||
      normalized === "cellular" ||
      normalized.includes("phone") ||
      normalized.includes("mobile") ||
      normalized.includes("iphone") ||
      normalized.includes("android")
    );
  }

  function isBookLabel(label) {
    const normalized = normalizeLabel(label);
    return (
      normalized === "book" ||
      normalized === "textbook" ||
      normalized === "notebook" ||
      normalized === "exercise book" ||
      normalized === "magazine" ||
      normalized === "pamphlet" ||
      normalized.includes("notebook") ||
      normalized.includes("book") ||
      normalized.includes("magazine") ||
      normalized.includes("paper")
    );
  }

  function normalizeObjectPredictions(predictions) {
    if (!Array.isArray(predictions)) return [];

    return predictions.map((item) => ({
      label: normalizeLabel(
        item?.label ?? item?.class ?? item?.className ?? item?.name ?? "",
      ),
      score: Number(item?.score ?? item?.confidence ?? 0),
    }));
  }

  function getFrameCapture(video) {
    const canvas = frameCanvasRef.current;
    const srcW = video.videoWidth || 0;
    const srcH = video.videoHeight || 0;
    if (!srcW || !srcH) return null;

    const maxW = 640;
    const scale = Math.min(1, maxW / srcW);
    const w = Math.max(1, Math.floor(srcW * scale));
    const h = Math.max(1, Math.floor(srcH * scale));

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, w, h);
    return {
      canvas,
      imageData: ctx.getImageData(0, 0, w, h),
    };
  }

  function captureSnapshot(video) {
    const canvas = snapshotCanvasRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      return "";
    }
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const maxW = 480;
    const scale = Math.min(1, maxW / srcW);
    canvas.width = Math.max(1, Math.floor(srcW * scale));
    canvas.height = Math.max(1, Math.floor(srcH * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.3);
  }

  function logViolation(type, severity, snapshot = "", video = null) {
    const now = Date.now();
    const last = lastViolationAtRef.current[type] || 0;
    const cooldown =
      type === "window_blur" ||
      type === "paste" ||
      type === "copy" ||
      type === "cut"
        ? 1500
        : type === "gaze_away"
          ? 2500
          : 3500;
    if (now - last < cooldown) {
      return;
    }
    lastViolationAtRef.current[type] = now;

    setViolationsCount((prevCount) => {
      const nextCount = prevCount + 1;
      if (nextCount > maxViolationsAllowed) {
        onForceSubmit?.("Maximum violations exceeded");
      }
      return nextCount;
    });

    setSuspicionScore((prevScore) =>
      Math.min(100, prevScore + (POINTS[type] || 0)),
    );

    const payload = {
      type,
      severity,
      timestamp: new Date().toISOString(),
      snapshot: snapshot || (video ? captureSnapshot(video) : ""),
    };
    Promise.resolve(onViolation?.(payload)).catch(() => null);
  }

  return { suspicionScore, violationsCount, detectorStatus };
}