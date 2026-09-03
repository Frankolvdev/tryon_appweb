from pathlib import Path

path = Path("src/app/globals.css")
if not path.exists():
    raise SystemExit("No se encontró src/app/globals.css. Ejecuta desde la raíz de AppWeb.")

marker = "/* 01E14 · password recovery inside official AuthShell */"
css = r"""
/* 01E14 · password recovery inside official AuthShell */
.boRecoverySecurity{display:flex;align-items:flex-start;gap:11px;padding:13px 14px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.025);color:#85858d}
.boRecoverySecurity svg{width:17px;height:17px;flex:0 0 17px;margin-top:1px;color:#e11d35}
.boRecoverySecurity p{margin:0;font-size:11px;line-height:1.6}
.boRecoveryState{display:grid;gap:18px;margin-top:26px;text-align:center}
.boRecoveryState h3{margin:0;color:#fff;font-size:25px;line-height:1.15;letter-spacing:-.03em}
.boRecoveryDescription{margin:0;color:#85858d;font-size:12px;line-height:1.7}
.boRecoveryIcon{width:58px;height:58px;margin:0 auto;display:grid;place-items:center;border:1px solid rgba(225,29,53,.18);border-radius:17px;background:rgba(77,7,17,.28);color:#e11d35}
.boRecoveryIcon svg{width:24px;height:24px}
.boRecoveryIconSuccess{border-color:rgba(74,222,128,.18);background:rgba(20,83,45,.18);color:#4ade80}
.boRecoveryEmail{min-width:0;display:flex;align-items:center;justify-content:center;gap:9px;padding:12px 14px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(0,0,0,.32);color:#d4d4d8;font-size:12px}
.boRecoveryEmail svg{width:16px;height:16px;flex:0 0 16px;color:#66666f}
.boRecoveryEmail span{overflow:hidden;text-overflow:ellipsis}
.boRecoveryNotice{display:flex;align-items:flex-start;gap:10px;padding:11px 13px;border:1px solid rgba(74,222,128,.18);border-radius:11px;background:rgba(20,83,45,.14);color:#86efac;text-align:left}
.boRecoveryNotice svg{width:17px;height:17px;flex:0 0 17px;margin-top:1px}
.boRecoveryNotice p,.boRecoveryMessage p{margin:0}
.boRecoveryMessage{display:flex;align-items:flex-start;gap:10px;text-align:left}
.boRecoveryMessage svg{width:17px;height:17px;flex:0 0 17px;margin-top:1px}
.boRecoveryActions{display:grid;gap:11px}
.boRecoverySecondary{height:48px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(0,0,0,.35);color:#d4d4d8;font-size:12px;font-weight:700;cursor:pointer}
.boRecoverySecondary:hover{border-color:rgba(225,29,53,.28);color:#fff}
.boRecoveryPasswordInput input{padding-right:46px}
.boRecoveryEye{position:absolute;right:14px;top:50%;width:18px;height:18px;padding:0;transform:translateY(-50%);border:0;background:transparent;color:#66666f;cursor:pointer}
.boRecoveryEye svg{width:100%;height:100%}
.boRecoveryStrength{display:grid;gap:8px;margin-top:-3px}
.boRecoveryStrength>div{display:flex;justify-content:space-between;color:#66666f;font-size:10px}
.boRecoveryStrength strong{color:#a0a0a7;font-weight:700}
.boRecoveryStrengthTrack{height:5px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.06)}
.boRecoveryStrengthTrack>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#790719,#e11d35,#4ade80);transition:width .2s ease}
.boRecoveryRequirements{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:13px 14px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(255,255,255,.02)}
.boRecoveryRule{display:flex;align-items:center;gap:7px;color:#5d5d65;font-size:10px}
.boRecoveryRule:before{content:"";width:6px;height:6px;flex:0 0 6px;border-radius:999px;background:#3f3f46}
.boRecoveryRuleValid{color:#86efac}
.boRecoveryRuleValid:before{background:#4ade80;box-shadow:0 0 10px rgba(74,222,128,.3)}
.boRecoveryLinkButton{display:grid;place-items:center;text-decoration:none}
@media(max-width:620px){.boRecoveryRequirements{grid-template-columns:1fr}}
"""

current = path.read_text(encoding="utf-8")
if marker not in current:
    path.write_text(current.rstrip() + "\n\n" + css.strip() + "\n", encoding="utf-8")
    print("Estilos 01E14 agregados a src/app/globals.css")
else:
    print("Los estilos 01E14 ya estaban instalados.")
