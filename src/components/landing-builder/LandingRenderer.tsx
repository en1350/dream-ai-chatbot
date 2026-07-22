import { ReactNode, Fragment } from "react";
import Icon from "@/components/ui/icon";
import { LandingBlock, LandingTheme } from "./types";
import EmailFormBlock from "./EmailFormBlock";

interface Props {
  blocks: LandingBlock[];
  theme: LandingTheme;
  vkGroupId?: number | null;
  editable?: boolean;
  selectedIndex?: number | null;
  onSelectBlock?: (i: number) => void;
  slug?: string;
}

function resolveCtaLink(block: LandingBlock, vkGroupId?: number | null): { href: string; disabled: boolean; external: boolean } {
  const type = block.ctaLinkType || "url";
  if (type === "email") {
    const email = (block.ctaLink || "").trim();
    return { href: email ? `mailto:${email}` : "#", disabled: !email, external: false };
  }
  if (type === "bot") {
    return vkGroupId
      ? { href: `https://vk.com/gim${vkGroupId}?sel=-${vkGroupId}`, disabled: false, external: true }
      : { href: "#", disabled: true, external: false };
  }
  return { href: block.ctaLink || "#cta", disabled: false, external: /^https?:\/\//.test(block.ctaLink || "") };
}

export default function LandingRenderer({ blocks, theme, vkGroupId, editable, selectedIndex, onSelectBlock, slug }: Props) {
  const wrap = (i: number, node: ReactNode) => {
    if (!editable) return <Fragment key={i}>{node}</Fragment>;
    const isSelected = selectedIndex === i;
    return (
      <div
        key={i}
        onClick={() => onSelectBlock?.(i)}
        className={`relative cursor-pointer transition-all ${
          isSelected ? "ring-2 ring-electric ring-inset" : "hover:ring-1 hover:ring-white/20 ring-inset"
        }`}
      >
        {node}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-ink text-white"
      style={{ ["--lp-primary" as string]: theme.primaryColor, ["--lp-accent" as string]: theme.accentColor }}
    >
      {blocks.map((block, i) => {
        if (block.type === "hero") {
          return wrap(
            i,
            <section className="relative pt-24 pb-20 px-6 overflow-hidden grain-bg">
              <div
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[130px] opacity-25"
                style={{ background: theme.primaryColor }}
              />
              <div className="max-w-3xl mx-auto text-center relative">
                {block.image && (
                  <img src={block.image} alt="" className="w-full max-w-md mx-auto rounded-2xl mb-8 object-cover" />
                )}
                <h1 className="font-display text-4xl md:text-5xl leading-tight mb-5">{block.title}</h1>
                {block.subtitle && <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">{block.subtitle}</p>}
                {block.ctaText && (() => {
                  const link = resolveCtaLink(block, vkGroupId);
                  return (
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      onClick={(e) => (editable || link.disabled) && e.preventDefault()}
                      aria-disabled={link.disabled}
                      className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-ink transition-all hover:brightness-110 ${link.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})` }}
                    >
                      {block.ctaText}
                      <Icon name="ArrowRight" size={18} />
                    </a>
                  );
                })()}
              </div>
            </section>
          );
        }

        if (block.type === "features") {
          return wrap(
            i,
            <section className="py-16 px-6">
              <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">
                {(block.features || []).map((f, j) => (
                  <div key={j} className="rounded-2xl border border-white/8 bg-ink2/50 p-6 text-center">
                    <div
                      className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${theme.primaryColor}22` }}
                    >
                      <Icon name={f.icon} size={22} style={{ color: theme.accentColor }} />
                    </div>
                    <h3 className="text-white font-semibold mb-1.5">{f.title}</h3>
                    <p className="text-white/50 text-sm">{f.text}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "cta") {
          return wrap(
            i,
            <section className="py-20 px-6">
              <div
                className="max-w-3xl mx-auto text-center rounded-3xl border border-white/10 p-12"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}1a, ${theme.accentColor}1a)` }}
              >
                <h2 className="font-display text-3xl mb-3">{block.title}</h2>
                {block.subtitle && <p className="text-white/60 mb-7 max-w-lg mx-auto">{block.subtitle}</p>}
                {block.ctaText && (() => {
                  const link = resolveCtaLink(block, vkGroupId);
                  return (
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      onClick={(e) => (editable || link.disabled) && e.preventDefault()}
                      aria-disabled={link.disabled}
                      className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-ink transition-all hover:brightness-110 ${link.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})` }}
                    >
                      {block.ctaText}
                      <Icon name="ArrowRight" size={18} />
                    </a>
                  );
                })()}
              </div>
            </section>
          );
        }

        if (block.type === "vk") {
          return wrap(
            i,
            <section className="py-16 px-6">
              <div className="max-w-2xl mx-auto text-center rounded-3xl border border-white/10 bg-ink2/50 p-10">
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
                >
                  <Icon name="MessageCircle" size={26} className="text-ink" />
                </div>
                <h2 className="font-display text-2xl mb-2">{block.title || "Напишите нам ВКонтакте"}</h2>
                <p className="text-white/50 mb-6">{block.subtitle || "Ответит бот, а по сложным вопросам подключится менеджер"}</p>
                {vkGroupId ? (
                  <a
                    href={`https://vk.com/gim${vkGroupId}?sel=-${vkGroupId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => editable && e.preventDefault()}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-ink transition-all hover:brightness-110"
                    style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})` }}
                  >
                    <Icon name="Send" size={18} />
                    Написать в сообщения
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-sm">
                    <Icon name="Unplug" size={14} />
                    Сообщество ВК не подключено
                  </span>
                )}
              </div>
            </section>
          );
        }

        if (block.type === "email-form") {
          return wrap(i, <EmailFormBlock block={block} theme={theme} editable={editable} slug={slug} />);
        }

        if (block.type === "image") {
          return wrap(
            i,
            <section className="py-10 px-6">
              <div className="max-w-3xl mx-auto text-center">
                {block.image ? (
                  <img src={block.image} alt={block.caption || ""} className="w-full rounded-2xl object-cover" />
                ) : (
                  <div className="w-full h-48 rounded-2xl border border-dashed border-white/15 flex items-center justify-center text-white/30 text-sm">
                    Картинка не загружена
                  </div>
                )}
                {block.caption && <p className="text-white/50 text-sm mt-3">{block.caption}</p>}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}