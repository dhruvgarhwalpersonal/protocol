/* ── smartFill — professional line chart fill plugin ────────────────────
   Draws each line's fill area using the EXACT bezier curve from Chart.js
   point control-points, so fills perfectly hug each curve.

   Rendering order (bottom → top in dataset array):
   • Overall  → drawn first, fills to baseline
   • Cat 1-N  → each fills from its own line DOWN to the line below it

   Overlap rule: drawn bottom-up with source-over, so the LOWER line's
   colour is always painted first and the upper line's fill sits on top —
   exactly what you want visually (lower line colour wins at the boundary).

   Toggle-safe: re-evaluates which datasets are visible on every render,
   so hiding any line only removes its own band; neighbours auto-reconnect.
─────────────────────────────────────────────────────────────────────── */
window.addEventListener('load', function(){
  if(!window.Chart) return;

  /* Build a canvas path that exactly follows a bezier line dataset.
     direction: 'fwd' = left→right, 'rev' = right→left (for closing shapes) */
  function buildPath(ctx, pts, direction) {
    var seq = direction === 'rev' ? pts.slice().reverse() : pts;
    var started = false;
    for(var i = 0; i < seq.length; i++){
      var pt = seq[i];
      if(pt.skip){ started = false; continue; }
      if(!started){
        ctx.moveTo(pt.x, pt.y);
        started = true;
      } else {
        var prev = seq[i-1];
        if(!prev || prev.skip){ ctx.moveTo(pt.x, pt.y); continue; }
        /* Chart.js 4 PointElement stores control points as:
           cp1x/cp1y = incoming handle, cp2x/cp2y = outgoing handle
           For forward (L→R): prev.cp2 → pt.cp1 → pt
           For reverse (R→L): seq is reversed so prev is now the RIGHT point
             outgoing of "prev" in reversed = cp1 of the original-right point
             incoming of "pt"  in reversed = cp2 of the original-left point   */
        var c1x, c1y, c2x, c2y;
        if(direction === 'fwd'){
          c1x = prev.cp2x; c1y = prev.cp2y;
          c2x = pt.cp1x;   c2y = pt.cp1y;
        } else {
          /* reversed: prev = originally-right, pt = originally-left */
          c1x = prev.cp1x; c1y = prev.cp1y;
          c2x = pt.cp2x;   c2y = pt.cp2y;
        }
        if(c1x !== undefined && c2x !== undefined){
          ctx.bezierCurveTo(c1x, c1y, c2x, c2y, pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
    }
    return started;
  }

  /* Create a vertical gradient for a fill area */
  function makeGradient(ctx, color, yTop, yBottom){
    /* parse "rgba(r,g,b,a)" or "#rrggbb" → get r,g,b */
    var m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    var base = m ? 'rgba('+m[1]+','+m[2]+','+m[3]+',' : 'rgba(128,128,200,';
    var g = ctx.createLinearGradient(0, yTop, 0, yBottom);
    g.addColorStop(0,   base + '0.22)');
    g.addColorStop(0.6, base + '0.08)');
    g.addColorStop(1,   base + '0.00)');
    return g;
  }

  Chart.register({
    id: 'smartFill',
    afterDatasetsDraw: function(chart){
      if(chart.config.type !== 'line') return;
      var ctx = chart.ctx;
      var yScale = chart.scales && chart.scales.y;
      if(!yScale) return;
      var yBaseline = yScale.getPixelForValue(yScale.min !== undefined ? yScale.min : 0);

      /* Build ordered visible list (dataset index order = bottom → top) */
      var vis = [];
      chart.data.datasets.forEach(function(ds, i){
        var meta = chart.getDatasetMeta(i);
        if(!meta.hidden && ds._bandColor){
          vis.push({ ds: ds, meta: meta, pts: meta.data });
        }
      });
      if(!vis.length) return;

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';

      /* Draw bottom → top so lower fills are painted first */
      for(var vi = 0; vi < vis.length; vi++){
        var upper = vis[vi];
        var lower = vi > 0 ? vis[vi-1] : null;
        var uPts = upper.pts;

        /* skip if no renderable points */
        var hasPoints = uPts.some(function(p){ return !p.skip; });
        if(!hasPoints) continue;

        /* Find extent for gradient */
        var yTop = Infinity;
        uPts.forEach(function(p){ if(!p.skip && p.y < yTop) yTop = p.y; });

        /* Find first/last non-skip upper points (for baseline connectors) */
        var uFirst = null, uLast = null;
        for(var k=0; k<uPts.length; k++){
          if(!uPts[k].skip){ if(!uFirst) uFirst=uPts[k]; uLast=uPts[k]; }
        }

        ctx.beginPath();

        /* 1. Trace upper line left→right */
        buildPath(ctx, uPts, 'fwd');

        /* 2. Close with lower boundary right→left */
        if(lower){
          var lPts = lower.pts;
          /* step across to rightmost visible point of lower line */
          var lLast = null;
          for(var k2=lPts.length-1; k2>=0; k2--){
            if(!lPts[k2].skip){ lLast=lPts[k2]; break; }
          }
          if(lLast && uLast) ctx.lineTo(lLast.x, lLast.y);
          buildPath(ctx, lPts, 'rev');
          /* close back to start of upper line */
          if(uFirst){ var lFirst=null;
            for(var k3=0;k3<lPts.length;k3++){ if(!lPts[k3].skip){lFirst=lPts[k3];break;} }
            if(lFirst) ctx.lineTo(uFirst.x, uFirst.y);
          }
        } else {
          /* No lower dataset: fill down to baseline */
          if(uLast)  ctx.lineTo(uLast.x,  yBaseline);
          if(uFirst) ctx.lineTo(uFirst.x, yBaseline);
        }

        ctx.closePath();
        ctx.fillStyle = makeGradient(ctx, upper.ds._bandColor, yTop, yBaseline);
        ctx.fill();
      }

      ctx.restore();
    }
  });
});
