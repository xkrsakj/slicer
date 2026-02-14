var SvgToGcodeConvertor = {
	instrArr: [],
	gcode: "",
	x: 0,
	y: 0,
	settings: {
		topAngle: 0,
		bottomAngle: 0,
		originOffsetX: 0,
		originOffsetY: 0,
		acceleration: 0,
		vMax: 166.6667
	},
	isPenDown: false,
	estTime: 0,

	convert: function(pathData, settings) {
		this.instrArr = pathData.split(" ");
		this.gcode = "G90\n";
		this.x = 0;
		this.y = 0;
		this.settings.topAngle = settings.topAngle;
		this.settings.bottomAngle = settings.bottomAngle;
		this.settings.originOffsetX = settings.originOffsetX;
		this.settings.originOffsetY = settings.originOffsetY;
		this.settings.acceleration = settings.acceleration;
		this.isPenDown = false;
		this.estTime = 0;

		var instrKind = "";
		var instrParams = [];

		for (let i = 0; i < this.instrArr.length; i++) {
			if (isNaN(parseFloat(this.instrArr[i]))) {
				if (instrKind) {
					this.execInstr(instrKind, instrParams);
				}

				instrKind = this.instrArr[i];
				instrParams = [];
				
				continue;
			}

			var res = this.instrArr[i].split(",").map(parseFloat);

			instrParams.push(...res);
		}

		this.execInstr(instrKind, instrParams);

		return this.gcode;
	},

	execInstr: function(kind, params) {
		var isCapital = /^[A-Z]*$/.test(kind);
		kind = kind.toLowerCase();

		if (kind == "m" && this.isPenDown) {
			this.gcode += `M3 s${this.settings.topAngle}\n`;
			this.isPenDown = false;
		} else if (kind != "m" && !this.isPenDown) {
			this.gcode += this.settings.bottomAngle == 0 ? "M5\n" : `M3 s${this.settings.bottomAngle}\n`;
			this.isPenDown = true;
		}

		if (kind == "m") {
			var prevX = this.x;
			var prevY = this.y;

			if (isCapital) {
				this.x = params[0];
				this.y = params[1];
			} else {
				this.x += params[0];
				this.y += params[1];
			}

			var d = Math.sqrt(Math.pow(prevX - this.x, 2) + Math.pow(prevY - this.y, 2));
			this.estTime += this.estimateTime(d);

			this.gcode += `G0 Y${210-this.x} X${this.y}\n`;

			if (params.length > 2) {
				this.execInstr(isCapital ? "L" : "l", params.slice(2));
			}
		} else if (kind == "v") {
			for (let i = 0; i < params.length; i++) {
				var prevX = this.x;
				var prevY = this.y;

				if (isCapital) {
					this.y = params[i];
				} else {
					this.y += params[i];
				}

				var d = Math.sqrt(Math.pow(prevX - this.x, 2) + Math.pow(prevY - this.y, 2));
				this.estTime += this.estimateTime(d);

				this.gcode += `G0 X${this.y}\n`;
			}
		} else if (kind == "h") {
			for (let i = 0; i < params.length; i++) {
				var prevX = this.x;
				var prevY = this.y;

				if (isCapital) {
					this.x = params[i];
				} else {
					this.x += params[i];
				}

				var d = Math.sqrt(Math.pow(prevX - this.x, 2) + Math.pow(prevY - this.y, 2));
				this.estTime += this.estimateTime(d);

				this.gcode += `G0 Y${210-this.x}\n`;
			}
		} else if (kind == "l") {
			for (let i = 0; i < params.length; i += 2) {
				var prevX = this.x;
				var prevY = this.y;

				if (isCapital) {
					this.x = params[i];
					this.y = params[i + 1];
				} else {
					this.x += params[i];
					this.y += params[i + 1];
				}

				var d = Math.sqrt(Math.pow(prevX - this.x, 2) + Math.pow(prevY - this.y, 2));
				this.estTime += this.estimateTime(d);

				this.gcode += `G0 Y${210-this.x} X${this.y}\n`;
			}
		} else if (kind == "c") {
			for (let i = 0; i < params.length; i += 6) {
				if (isCapital) {
					this.gcode += this.cubicBezier(this.x, this.y, params[i], params[i + 1], params[i + 2], params[i + 3], params[i + 4], params[i + 5]);

					this.x = params[i + 4];
					this.y = params[i + 5];
				} else {
					this.gcode += this.cubicBezier(this.x, this.y, this.x + params[i], this.y + params[i + 1], this.x + params[i + 2], this.y + params[i + 3], this.x + params[i + 4], this.y + params[i + 5]);					

					this.x += params[i + 4];
					this.y += params[i + 5];
				}
			}
		}
	},

	cubicBezier: function(x0, y0, x1, y1, x2, y2, x3, y3) {
		var instrs = "";
		var res = 20;

		var x = x0;
		var y = y0;

		var totalD = 0;

		for (let i = 0; i < res; i++) {
			var t = i * (1 / res);
			var nextX = (1 - t) ** 3 * x0 + 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3 * x3;
			var nextY = (1 - t) ** 3 * y0 + 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3 * y3;

			totalD += Math.sqrt(Math.pow(x - nextX, 2) + Math.pow(y - nextY, 2));

			instrs += `G0 Y${210-nextX} X${nextY}\n`;

			x = nextX;
			y = nextY;
		}

		totalD += Math.sqrt(Math.pow(x - x3, 2) + Math.pow(y - y3, 2));
		this.estTime += this.estimateTime(totalD);

		instrs += `G0 Y${210-x3} X${y3}\n`;

		return instrs;
	},

	estimateTime: function(d) {
		var da = Math.pow(this.settings.vMax, 2) / (2 * this.settings.acceleration);

		if (d > 2 * da) {
			return this.settings.vMax / this.settings.acceleration + (d - 2 * da) / this.settings.vMax + this.settings.vMax / this.settings.acceleration;
		}

		return 2 * Math.sqrt(d / this.settings.acceleration);
	}
};

module.exports = {
    SvgToGcodeConvertor
}