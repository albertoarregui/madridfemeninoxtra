const rayo_vallecano = new Proxy({"src":"/_astro/rayo_vallecano.DTsERtRH.png","width":1200,"height":1060,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/rayo_vallecano.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_31 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: rayo_vallecano
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_31 as _ };
