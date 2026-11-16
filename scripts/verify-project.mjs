import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const project = await readFile('project.godot', 'utf8');
const preset = await readFile('export_presets.cfg', 'utf8');
assert.ok(project.includes('run/main_scene="res://main.tscn"'));
assert.ok(project.includes('renderer/rendering_method="gl_compatibility"'));
assert.ok(preset.includes('variant/thread_support=false'));
assert.ok(preset.includes('variant/extensions_support=false'));
assert.match(preset, /platform="Web"/);
const ignored = new Set(['.git', '.godot', 'Godot', 'node_modules', 'build', 'dist', '.cache']);
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = dir + '/' + entry.name;
    if (entry.isDirectory()) await scan(file);
    else assert.ok(!/\.(cs|csproj|sln|gdextension)$/i.test(entry.name), 'GDScript-only export required: ' + file);
  }
}
await scan('.');
console.log('PASS: GDScript, main scene, Compatibility, threads OFF, extensions OFF');
