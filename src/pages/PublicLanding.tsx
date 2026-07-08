import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import LandingRenderer from "@/components/landing-builder/LandingRenderer";
import { LandingBlock, LandingTheme, DEFAULT_THEME } from "@/components/landing-builder/types";
import func2url from "../../backend/func2url.json";

const PublicLanding = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const [blocks, setBlocks] = useState<LandingBlock[]>([]);
  const [theme, setTheme] = useState<LandingTheme>(DEFAULT_THEME);
  const [vkGroupId, setVkGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const previewParam = isPreview ? "&preview=1" : "";
    fetch(`${func2url["landing-public"]}?slug=${encodeURIComponent(slug)}${previewParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setNotFound(true);
          return;
        }
        setBlocks(data.blocks || []);
        setTheme({ ...DEFAULT_THEME, ...(data.theme || {}) });
        setVkGroupId(data.vkGroupId ?? null);
        if (data.name) document.title = data.name;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-ink text-white gap-3">
        <Icon name="Loader2" size={20} className="animate-spin text-aqua" />
        <span className="text-white/60 text-sm">Загружаю страницу…</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ink text-white gap-4">
        <Icon name="FileQuestion" size={32} className="text-white/30" />
        <p className="text-white/60">Страница не найдена или ещё не опубликована</p>
      </div>
    );
  }

  return (
    <>
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 bg-amber-400 text-ink text-sm font-medium">
          <Icon name="Eye" size={14} />
          Предпросмотр — эта страница ещё не опубликована
        </div>
      )}
      <div className={isPreview ? "pt-9" : ""}>
        <LandingRenderer blocks={blocks} theme={theme} vkGroupId={vkGroupId} slug={slug} />
      </div>
    </>
  );
};

export default PublicLanding;