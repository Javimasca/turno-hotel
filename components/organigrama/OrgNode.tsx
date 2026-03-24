"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type OrgNodeModel = {
  id: string;
  name: string;
  photoUrl: string | null;
  role: string | null;
  workplaceName: string | null;
  directManagerEmployeeId: string | null;
  children: OrgNodeModel[];
};

type ExpansionMode = "default" | "all" | "collapsed";

type Props = {
  node: OrgNodeModel;
  level?: number;
  expansionMode?: ExpansionMode;
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "HR";
  }

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase() || "HR";
}

function getDefaultExpanded(level: number) {
  return level < 2;
}

export default function OrgNode({
  node,
  level = 0,
  expansionMode = "default",
}: Props) {
  const initials = getInitials(node.name);
  const hasChildren = node.children.length > 0;
  const hasMultipleChildren = node.children.length > 1;

  const [isExpanded, setIsExpanded] = useState(getDefaultExpanded(level));

  useEffect(() => {
    if (expansionMode === "all") {
      setIsExpanded(true);
      return;
    }

    if (expansionMode === "collapsed") {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(getDefaultExpanded(level));
  }, [expansionMode, level]);

  const childCountLabel = useMemo(() => {
    if (node.children.length === 1) {
      return "1 persona a cargo";
    }

    return `${node.children.length} personas a cargo`;
  }, [node.children.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        minWidth: "200px",
      }}
    >
      {level > 0 ? (
        <div
          aria-hidden="true"
          style={{
            width: "2px",
            height: "16px",
            background:
              "linear-gradient(180deg, rgba(29,42,71,0.10) 0%, rgba(247,166,0,0.28) 100%)",
          }}
        />
      ) : null}

      <div
        style={{
          width: "200px",
          minHeight: "160px",
          borderRadius: "20px",
          padding: "0.95rem 0.85rem 0.9rem 0.85rem",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(246,249,252,0.98) 100%)",
          border: "1px solid rgba(29,42,71,0.08)",
          boxShadow:
            "0 12px 28px rgba(18, 28, 45, 0.06), 0 2px 8px rgba(247,166,0,0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          transition:
            "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 auto auto 0",
            width: "100%",
            height: "4px",
            background:
              "linear-gradient(90deg, #1d2a47 0%, #304a7a 58%, #f7a600 100%)",
          }}
        />

        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={
              isExpanded
                ? `Contraer equipo de ${node.name}`
                : `Expandir equipo de ${node.name}`
            }
            aria-expanded={isExpanded}
            title={isExpanded ? "Contraer equipo" : "Expandir equipo"}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "28px",
              height: "28px",
              borderRadius: "9999px",
              border: "1px solid rgba(29,42,71,0.10)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,247,250,0.98) 100%)",
              color: "#1d2a47",
              fontSize: "0.95rem",
              fontWeight: 800,
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 6px 14px rgba(18, 28, 45, 0.08)",
              transition:
                "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: isExpanded ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.2s ease",
                fontSize: "0.95rem",
                marginTop: "-1px",
              }}
            >
              {isExpanded ? "−" : "+"}
            </span>
          </button>
        ) : null}

        {node.photoUrl ? (
          <Image
            src={node.photoUrl}
            alt={`Foto de ${node.name}`}
            width={64}
            height={64}
            quality={90}
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "9999px",
              objectFit: "cover",
              border: "3px solid rgba(255,255,255,0.96)",
              boxShadow: "0 8px 18px rgba(29,42,71,0.14)",
              marginBottom: "0.75rem",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              fontWeight: 800,
              color: "#1d2a47",
              background:
                "linear-gradient(135deg, rgba(247,166,0,0.22) 0%, rgba(61,92,161,0.18) 100%)",
              border: "3px solid rgba(255,255,255,0.96)",
              boxShadow: "0 8px 18px rgba(29,42,71,0.10)",
              marginBottom: "0.75rem",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}

        <div
          style={{
            fontSize: "0.96rem",
            fontWeight: 800,
            color: "#1d2a47",
            lineHeight: 1.2,
            marginBottom: "0.3rem",
            maxWidth: "100%",
          }}
        >
          {node.name}
        </div>

        <div
          style={{
            fontSize: "0.82rem",
            color: "#55637d",
            lineHeight: 1.25,
            minHeight: "2rem",
            marginBottom: "0.6rem",
            maxWidth: "100%",
          }}
        >
          {node.role ?? "Sin categoría vigente"}
        </div>

        {node.workplaceName ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.28rem 0.62rem",
              borderRadius: "9999px",
              background: "rgba(61, 92, 161, 0.10)",
              color: "#304a7a",
              fontSize: "0.72rem",
              fontWeight: 700,
              maxWidth: "100%",
              marginBottom: hasChildren ? "0.6rem" : "0",
            }}
          >
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {node.workplaceName}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.28rem 0.62rem",
              borderRadius: "9999px",
              background: "rgba(148, 163, 184, 0.12)",
              color: "#64748b",
              fontSize: "0.72rem",
              fontWeight: 700,
              marginBottom: hasChildren ? "0.6rem" : "0",
            }}
          >
            Sin centro
          </div>
        )}

        {hasChildren ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.36rem 0.68rem",
              borderRadius: "9999px",
              background: isExpanded
                ? "rgba(247,166,0,0.12)"
                : "rgba(29,42,71,0.08)",
              color: isExpanded ? "#8a5a00" : "#334155",
              fontSize: "0.72rem",
              fontWeight: 800,
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "9999px",
                background: isExpanded ? "#f7a600" : "#64748b",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {childCountLabel}
          </div>
        ) : null}
      </div>

      {hasChildren ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxHeight: isExpanded ? "4000px" : "0",
            opacity: isExpanded ? 1 : 0,
            overflow: "hidden",
            transition:
              "max-height 0.35s ease, opacity 0.25s ease, transform 0.25s ease",
            transform: isExpanded ? "translateY(0)" : "translateY(-6px)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "2px",
              height: "16px",
              background:
                "linear-gradient(180deg, rgba(29,42,71,0.14) 0%, rgba(247,166,0,0.30) 100%)",
            }}
          />

          {hasMultipleChildren ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: `${Math.max(node.children.length - 1, 0) * 236}px`,
                  maxWidth: "calc(100% - 24px)",
                  minWidth: "100px",
                  height: "2px",
                  borderRadius: "9999px",
                  background:
                    "linear-gradient(90deg, rgba(29,42,71,0.08) 0%, rgba(247,166,0,0.26) 50%, rgba(29,42,71,0.08) 100%)",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  gap: "28px",
                  flexWrap: "nowrap",
                }}
              >
                {node.children.map((child) => (
                  <OrgNode
                    key={child.id}
                    node={child}
                    level={level + 1}
                    expansionMode={expansionMode}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              <OrgNode
                node={node.children[0]}
                level={level + 1}
                expansionMode={expansionMode}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}