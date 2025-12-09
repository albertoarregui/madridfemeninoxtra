const athletic_club = new Proxy({"src":"/_astro/athletic_club.C0nP71B6.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/athletic_club.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: athletic_club
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_5 as _ };
