"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import OrgNode from "@/components/organigrama/OrgNode";

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
  nodes: OrgNodeModel[];
};

function countNodes(nodes: OrgNodeModel[]): number {
  return nodes.reduce((total, node) => {
    return total + 1 + countNodes(node.children);
  }, 0);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function filterTreeByName(
  nodes: OrgNodeModel[],
  searchTerm: string
): OrgNodeModel[] {
  const normalizedSearch = normalizeText(searchTerm);

  if (!normalizedSearch) {
    return nodes;
  }

  return nodes.reduce<OrgNodeModel[]>((acc, node) => {
    const selfMatches = normalizeText(node.name).includes(normalizedSearch);
    const filteredChildren = filterTreeByName(node.children, searchTerm);

    if (selfMatches || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren,
      });
    }

    return acc;
  }, []);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function OrganigramaTree({ nodes }: Props) {
  const [expansionMode, setExpansionMode] = useState<ExpansionMode>("default");
  const [search, setSearch] = useState("");

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const totalPeople = useMemo(() => countNodes(nodes), [nodes]);
  const totalRoots = nodes.length;

  const filteredNodes = useMemo(() => {
    return filterTreeByName(nodes, search);
  }, [nodes, search]);

  const filteredPeople = useMemo(() => {
    return countNodes(filteredNodes);
  }, [filteredNodes]);

  const isSearching = search.trim().length > 0;

  function getBounds(nextScale: number) {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) {
      return {
        minX: -600,
        maxX: 600,
        minY: -600,
        maxY: 200,
      };
    }

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;

    const contentWidth = content.scrollWidth * nextScale;
    const contentHeight = content.scrollHeight * nextScale;

    const horizontalSlack = Math.max((contentWidth - viewportWidth) / 2, 0);
    const verticalSlack = Math.max(contentHeight - viewportHeight, 0);

    const sidePadding = 160;
    const topPadding = 80;
    const bottomPadding = 140;

    return {
      minX: -(horizontalSlack + sidePadding),
      maxX: horizontalSlack + sidePadding,
      minY: -(verticalSlack + bottomPadding),
      maxY: topPadding,
    };
  }

  function clampTranslate(nextTranslate: { x: number; y: number }, nextScale: number) {
    const bounds = getBounds(nextScale);

    return {
      x: clamp(nextTranslate.x, bounds.minX, bounds.maxX),
      y: clamp(nextTranslate.y, bounds.minY, bounds.maxY),
    };
  }

  function zoomIn() {
    setScale((prevScale) => {
      const newScale = clamp(Number((prevScale + 0.1).toFixed(3)), 0.6, 1.8);

      setTranslate((prevTranslate) =>
        clampTranslate(prevTranslate, newScale)
      );

      return newScale;
    });
  }

  function zoomOut() {
    setScale((prevScale) => {
      const newScale = clamp(Number((prevScale - 0.1).toFixed(3)), 0.6, 1.8);

      setTranslate((prevTranslate) =>
        clampTranslate(prevTranslate, newScale)
      );

      return newScale;
    });
  }

  function resetView() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest("button, input")) {
      return;
    }

    setIsDragging(true);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: translate.x,
      originY: translate.y,
    };
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!dragStateRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    const nextTranslate = {
      x: dragStateRef.current.originX + deltaX,
      y: dragStateRef.current.originY + deltaY,
    };

    setTranslate(clampTranslate(nextTranslate, scale));
  }

  function handleMouseUp() {
    setIsDragging(false);
    dragStateRef.current = null;
  }

  function handleMouseLeave() {
    setIsDragging(false);
    dragStateRef.current = null;
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const zoomIntensity = 0.0015;
    const zoomFactor = -event.deltaY * zoomIntensity;

    setScale((prevScale) => {
      const newScale = clamp(
        Number((prevScale + zoomFactor).toFixed(3)),
        0.6,
        1.8
      );

      const scaleRatio = newScale / prevScale;

      setTranslate((prevTranslate) => {
        const dx = mouseX - prevTranslate.x;
        const dy = mouseY - prevTranslate.y;

        const rawTranslate = {
          x: mouseX - dx * scaleRatio,
          y: mouseY - dy * scaleRatio,
        };

        return clampTranslate(rawTranslate, newScale);
      });

      return newScale;
    });
  }

  useEffect(() => {
    function handleResize() {
      setTranslate((prevTranslate) => clampTranslate(prevTranslate, scale));
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [scale]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
          padding: "0.9rem 1rem",
          borderRadius: "18px",
          border: "1px solid rgba(29,42,71,0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
          boxShadow: "0 10px 24px rgba(18, 28, 45, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.9rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "#1d2a47",
              }}
            >
              Navegación del organigrama
            </div>

            <div
              style={{
                fontSize: "0.82rem",
                color: "#55637d",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.55rem",
                alignItems: "center",
              }}
            >
              <span>{isSearching ? filteredPeople : totalPeople} personas</span>

              <span
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "9999px",
                  background: "rgba(85,99,125,0.55)",
                  display: "inline-block",
                }}
              />

              <span>
                {totalRoots}{" "}
                {totalRoots === 1 ? "raíz principal" : "raíces principales"}
              </span>

              {isSearching ? (
                <>
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "9999px",
                      background: "rgba(85,99,125,0.55)",
                      display: "inline-block",
                    }}
                  />

                  <span>resultado filtrado</span>
                </>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setExpansionMode("default")}
              style={{
                border: "1px solid rgba(29,42,71,0.10)",
                background:
                  expansionMode === "default"
                    ? "linear-gradient(90deg, rgba(29,42,71,0.95) 0%, rgba(48,74,122,0.95) 100%)"
                    : "rgba(255,255,255,0.96)",
                color: expansionMode === "default" ? "#ffffff" : "#1d2a47",
                padding: "0.58rem 0.9rem",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow:
                  expansionMode === "default"
                    ? "0 10px 20px rgba(29,42,71,0.14)"
                    : "0 6px 14px rgba(18, 28, 45, 0.05)",
                transition: "all 0.2s ease",
              }}
            >
              Vista inicial
            </button>

            <button
              type="button"
              onClick={() => setExpansionMode("all")}
              style={{
                border: "1px solid rgba(29,42,71,0.10)",
                background:
                  expansionMode === "all"
                    ? "linear-gradient(90deg, rgba(29,42,71,0.95) 0%, rgba(48,74,122,0.95) 100%)"
                    : "rgba(255,255,255,0.96)",
                color: expansionMode === "all" ? "#ffffff" : "#1d2a47",
                padding: "0.58rem 0.9rem",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow:
                  expansionMode === "all"
                    ? "0 10px 20px rgba(29,42,71,0.14)"
                    : "0 6px 14px rgba(18, 28, 45, 0.05)",
                transition: "all 0.2s ease",
              }}
            >
              Expandir todo
            </button>

            <button
              type="button"
              onClick={() => setExpansionMode("collapsed")}
              style={{
                border: "1px solid rgba(29,42,71,0.10)",
                background:
                  expansionMode === "collapsed"
                    ? "linear-gradient(90deg, rgba(29,42,71,0.95) 0%, rgba(48,74,122,0.95) 100%)"
                    : "rgba(255,255,255,0.96)",
                color: expansionMode === "collapsed" ? "#ffffff" : "#1d2a47",
                padding: "0.58rem 0.9rem",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow:
                  expansionMode === "collapsed"
                    ? "0 10px 20px rgba(29,42,71,0.14)"
                    : "0 6px 14px rgba(18, 28, 45, 0.05)",
                transition: "all 0.2s ease",
              }}
            >
              Contraer todo
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 320px",
              maxWidth: "460px",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar persona por nombre"
              aria-label="Buscar persona por nombre"
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "9999px",
                border: "1px solid rgba(29,42,71,0.10)",
                padding: "0 1rem",
                paddingRight: search ? "3rem" : "1rem",
                fontSize: "0.9rem",
                color: "#1d2a47",
                background: "rgba(255,255,255,0.96)",
                outline: "none",
                boxShadow: "0 6px 14px rgba(18, 28, 45, 0.04)",
              }}
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "8px",
                  transform: "translateY(-50%)",
                  width: "30px",
                  height: "30px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(29,42,71,0.10)",
                  background: "rgba(255,255,255,0.98)",
                  color: "#1d2a47",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.55rem",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={zoomOut}
              aria-label="Reducir zoom"
              title="Reducir zoom"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                border: "1px solid rgba(29,42,71,0.10)",
                background: "rgba(255,255,255,0.96)",
                color: "#1d2a47",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 14px rgba(18, 28, 45, 0.05)",
              }}
            >
              −
            </button>

            <div
              style={{
                minWidth: "72px",
                height: "40px",
                padding: "0 0.8rem",
                borderRadius: "9999px",
                border: "1px solid rgba(29,42,71,0.08)",
                background: "rgba(255,255,255,0.96)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1d2a47",
                fontSize: "0.82rem",
                fontWeight: 800,
                boxShadow: "0 6px 14px rgba(18, 28, 45, 0.04)",
              }}
            >
              {Math.round(scale * 100)}%
            </div>

            <button
              type="button"
              onClick={zoomIn}
              aria-label="Aumentar zoom"
              title="Aumentar zoom"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                border: "1px solid rgba(29,42,71,0.10)",
                background: "rgba(255,255,255,0.96)",
                color: "#1d2a47",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 14px rgba(18, 28, 45, 0.05)",
              }}
            >
              +
            </button>

            <button
              type="button"
              onClick={resetView}
              style={{
                border: "1px solid rgba(29,42,71,0.10)",
                background: "rgba(255,255,255,0.96)",
                color: "#1d2a47",
                padding: "0.58rem 0.9rem",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 14px rgba(18, 28, 45, 0.05)",
              }}
            >
              Reset vista
            </button>

            {isSearching ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.45rem 0.8rem",
                  borderRadius: "9999px",
                  background: "rgba(247,166,0,0.10)",
                  color: "#8a5a00",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                }}
              >
                Búsqueda activa
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {filteredNodes.length === 0 ? (
        <div
          style={{
            minHeight: "220px",
            borderRadius: "20px",
            border: "1px dashed rgba(29,42,71,0.18)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "1.5rem",
            color: "#55637d",
          }}
        >
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "#1d2a47",
              marginBottom: "0.35rem",
            }}
          >
            No encontramos coincidencias
          </div>

          <div
            style={{
              fontSize: "0.9rem",
              maxWidth: "420px",
              lineHeight: 1.5,
            }}
          >
            Ajustamos la vista a las personas cuyo nombre coincide con la
            búsqueda. Probad con otro término.
          </div>
        </div>
      ) : (
        <div
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onDoubleClick={resetView}
          style={{
            overflow: "hidden",
            padding: "0.5rem",
            borderRadius: "20px",
            border: "1px solid rgba(29,42,71,0.06)",
            background:
              "linear-gradient(180deg, rgba(250,251,253,0.9) 0%, rgba(245,247,250,0.9) 100%)",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
        >
          <div
            style={{
              minHeight: "520px",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: "center top",
              transition: isDragging ? "none" : "transform 0.18s ease",
              willChange: "transform",
            }}
          >
            <div
              ref={contentRef}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                gap: "40px",
                minWidth: "100%",
                alignItems: "flex-start",
                padding: "0.5rem 0.75rem 1.5rem 0.75rem",
              }}
            >
              {filteredNodes.map((node) => (
                <OrgNode
                  key={node.id}
                  node={node}
                  expansionMode={isSearching ? "all" : expansionMode}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}