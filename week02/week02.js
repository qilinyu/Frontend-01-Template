// 匹配所有 Number 直接量
let reg = new RegExp("^[0-9]$");
  
// UTF-8 Encoding 的函数
  function encodingUtf8(string) {
    let code = encodeURIComponent(s);
      let bytes = [];
      for (let i = 0; i < code.length; i++) {
          let c = code.charAt(i);
          if (c === '%') {
              bytes.push(parseInt(code.charAt(i + 1) + code.charAt(i + 2), 16) );
              i += 2;
          } 
          else {
              bytes.push(c.charCodeAt(0));
          }
      }
      return bytes;
  }
  
  // 匹配所有的字符串直接量，单引号和双引号
    let reg = new RegExp( /"(?:[^"\\]|\\[\d\D])*"/)