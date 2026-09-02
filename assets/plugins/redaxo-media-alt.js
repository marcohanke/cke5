(function () {
  window.CKE5_MEDIA_ALT = window.CKE5_MEDIA_ALT || {};

  function detectClang(imageConfig) {
    var fromUrl = new URLSearchParams(window.location.search).get('clang');
    if (fromUrl && /^\d+$/.test(fromUrl)) {
      return parseInt(fromUrl, 10);
    }
    if (imageConfig && /^\d+$/.test(String(imageConfig.rexmedia_alt_clang || ''))) {
      return parseInt(imageConfig.rexmedia_alt_clang, 10);
    }
    return null;
  }

  function closePicker(pickerEl) {
    if (pickerEl && pickerEl.parentNode) {
      pickerEl.parentNode.removeChild(pickerEl);
    }
    window.jQuery && window.jQuery(document).off('mousedown.ck5AltPicker keydown.ck5AltPicker');
  }

  function showLanguagePicker(languages, callback) {
    var overlay = document.createElement('div');
    overlay.className = 'ck5-alt-lang-picker';
    overlay.style.cssText = 'position:fixed;z-index:100000;top:50%;left:50%;transform:translate(-50%,-50%);'
      + 'background:#fff;border:1px solid #ccc;border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.2);padding:12px 14px;'
      + 'font:13px/1.4 sans-serif;color:#222;min-width:220px;';

    var label = document.createElement('div');
    label.textContent = 'Sprache für ALT-Text wählen';
    label.style.cssText = 'margin-bottom:6px;font-weight:600;';
    overlay.appendChild(label);

    var select = document.createElement('select');
    select.style.cssText = 'width:100%;padding:4px;margin-bottom:8px;';
    languages.forEach(function (lang) {
      var opt = document.createElement('option');
      opt.value = String(lang.clangId);
      opt.textContent = lang.label + ': ' + lang.value;
      select.appendChild(opt);
    });
    overlay.appendChild(select);

    var actions = document.createElement('div');
    actions.style.cssText = 'text-align:right;';
    var okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.textContent = 'Übernehmen';
    okBtn.style.cssText = 'padding:4px 10px;';
    actions.appendChild(okBtn);
    overlay.appendChild(actions);

    function finish(value) {
      closePicker(overlay);
      callback(value);
    }

    okBtn.addEventListener('click', function () {
      var chosen = languages.filter(function (l) { return String(l.clangId) === select.value; })[0];
      finish(chosen ? chosen.value : '');
    });

    document.body.appendChild(overlay);
    select.focus();

    if (window.jQuery) {
      window.jQuery(document).on('keydown.ck5AltPicker', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
          finish(languages[0] ? languages[0].value : '');
        }
      });
    }
  }

  window.CKE5_MEDIA_ALT.resolve = function resolve(filename, options, callback) {
    var imageConfig = (options && options.imageConfig) || {};
    var clangId = detectClang(imageConfig);

    var url = 'index.php?rex-api-call=cke5_media_meta&file=' + encodeURIComponent(filename)
      + (clangId ? '&clang=' + clangId : '');

    if (!window.jQuery) {
      callback('');
      return;
    }

    window.jQuery.getJSON(url).done(function (data) {
      if (!data) {
        callback('');
        return;
      }
      if (clangId || !data.altMultilingual || !data.altLanguages || data.altLanguages.length < 2) {
        callback(data.alt || '');
        return;
      }
      showLanguagePicker(data.altLanguages, callback);
    }).fail(function () {
      callback('');
    });
  };

  window.CKE5_MEDIA_ALT.applyAltToSelectedImage = function applyAltToSelectedImage(editor, altText) {
    if (!editor || 'string' !== typeof altText) {
      return;
    }
    var imageUtils = editor.plugins && editor.plugins.has('ImageUtils') ? editor.plugins.get('ImageUtils') : null;
    var element = imageUtils && typeof imageUtils.getClosestSelectedImageElement === 'function'
      ? imageUtils.getClosestSelectedImageElement(editor.model.document.selection)
      : editor.model.document.selection.getSelectedElement();
    if (!element) {
      return;
    }
    editor.model.change(function (writer) {
      writer.setAttribute('alt', altText, element);
    });
  };
})();
