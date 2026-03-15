"use client";

import { useState, useCallback } from "react";

export interface TreeNode {
  id: string;
  label: string;
  sublabel?: string;
  children?: TreeNode[];
}

interface TreeViewProps {
  nodes: TreeNode[];
  onNodeClick?: (node: TreeNode) => void;
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  onNodeClick?: (node: TreeNode) => void;
}

function TreeNodeItem({ node, depth, onNodeClick }: TreeNodeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
  }, [hasChildren]);

  const handleClick = useCallback(() => {
    onNodeClick?.(node);
  }, [node, onNodeClick]);

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-[var(--color-primary-light)] transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button
          type="button"
          onClick={handleToggle}
          className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--color-text-muted)] text-xs"
          aria-label={expanded ? "Recolher" : "Expandir"}
        >
          {hasChildren ? (expanded ? "\u25BC" : "\u25B6") : ""}
        </button>
        <button
          type="button"
          onClick={handleClick}
          className="flex-1 text-left text-sm text-[var(--color-text)]"
        >
          <span className="font-medium">{node.label}</span>
          {node.sublabel && (
            <span className="ml-2 text-xs text-[var(--color-text-muted)]">
              {node.sublabel}
            </span>
          )}
        </button>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ nodes, onNodeClick }: TreeViewProps) {
  if (nodes.length === 0) {
    return (
      <div className="rounded border border-[var(--color-primary-light)] p-8 text-center text-[var(--color-text-muted)]">
        Nenhum item para exibir.
      </div>
    );
  }

  return (
    <div className="rounded border border-[var(--color-primary-light)] p-2">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
}
