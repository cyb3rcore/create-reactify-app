export type VFSNode = {
  name: string;
  path: string;
} & (
  | { type: "file"; content?: string }
  | { type: "directory"; children: VFSNode[] }
);

export class VirtualFileSystem {
  private files: Map<string, string> = new Map();

  writeFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  readFile(path: string): string | undefined {
    return this.files.get(path);
  }

  exists(path: string): boolean {
    return this.files.has(path);
  }

  deleteFile(path: string): void {
    this.files.delete(path);
  }

  getAllFiles(): string[] {
    return [...this.files.keys()].sort();
  }

  getFileCount(): number {
    return this.files.size;
  }

  toTree(rootName: string = "project"): VFSNode {
    const root: VFSNode = {
      name: rootName,
      type: "directory",
      path: "/",
      children: [],
    };

    for (const [filePath, content] of this.files) {
      const parts = filePath.split("/").filter(Boolean);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const parentPath = parts.slice(0, i).join("/");
        const fullPath = parentPath ? `${parentPath}/${part}` : part;

        if (isLast) {
          current.children.push({
            name: part,
            type: "file",
            path: fullPath,
            content,
          });
        } else {
          let dir = current.children.find(
            (c): c is VFSNode & { type: "directory"; children: VFSNode[] } =>
              c.type === "directory" && c.name === part
          );
          if (!dir) {
            dir = {
              name: part,
              type: "directory",
              path: fullPath,
              children: [],
            };
            current.children.push(dir);
          }
          current = dir;
        }
      }
    }

    return root;
  }
}
