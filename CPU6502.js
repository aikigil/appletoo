/*
	Represents a 6502 CPU.
	Parameters:
	- memory: an initialized array, representing the memory of the device
	- compatibility: run the CPU in compatibility mode 
*/

var CPU6502 = function(memory, compatibility) {

	// Memory is stored as numbers
  // See: http://jsperf.com/tostring-16-vs-parseint-x-16
  // Registers

  this.AC = 0;
  this.XR = 0;
  this.YR = 0;
  this.SR = 0;
  this.SP = 0xFF;
  this.PC = 0xC000;

  this.running = false;
  this.cycles = 0;
  this.memory = memory;
  this.COMPATIBILITY_MODE = compatibility === null ? false : compatibility;

  this.SR_FLAGS = {
	  "N" : 128,
	  "V" : 64,
	  "_" : 32,
	  "B" : 16,
	  "D" : 8,
	  "I" : 4,
	  "Z" : 2,
	  "C" : 1
	};

	//Used for soft switches
	this.memory_callbacks = [];

  this.opcodes = {
	  0xA0 : function() { this.ldy(this.immediate()); this.cycles += 2; },
	  0xA4 : function() { this.ldy(this.zero_page()); this.cycles += 3; },
	  0xB4 : function() { this.ldy(this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0xAC : function() { this.ldy(this.absolute()); this.cycles += 4; },
	  0xBC : function() { this.ldy(this.absolute_indexed_with_x()); this.cycles += 4; },
	  0xA2 : function() { this.ldx(this.immediate()); this.cycles += 2; },
	  0xA6 : function() { this.ldx(this.zero_page()); this.cycles += 3; },
	  0xB6 : function() { this.ldx(this.zero_page_indexed_with_y()); this.cycles += 4; },
	  0xAE : function() { this.ldx(this.absolute()); this.cycles += 4; },
	  0xBE : function() { this.ldx(this.absolute_indexed_with_y()); this.cycles += 4; },
	  0xA9 : function() { this.lda(this.immediate()); this.cycles += 2; },
	  0xA5 : function() { this.lda(this.zero_page()); this.cycles += 3; },
	  0xB5 : function() { this.lda(this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0xAD : function() { this.lda(this.absolute()); this.cycles += 4; },
	  0xBD : function() { this.lda(this.absolute_indexed_with_x()); this.cycles += 4; },
	  0xB9 : function() { this.lda(this.absolute_indexed_with_y()); this.cycles += 4; },
	  0xA1 : function() { this.lda(this.indexed_x_indirect()); this.cycles += 6; },
	  0xB1 : function() { this.lda(this.indirect_indexed_y()); this.cycles += 6; },
	  0x86 : function() { this.stx(this.zero_page()); this.cycles += 3; },
	  0x96 : function() { this.stx(this.zero_page_indexed_with_y()); this.cycles += 4; },
	  0x8E : function() { this.stx(this.absolute()); this.cycles += 4; },
	  0x84 : function() { this.sty(this.zero_page()); this.cycles += 3; },
	  0x94 : function() { this.sty(this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0x8C : function() { this.sty(this.absolute()); this.cycles += 4; },
	  0x85 : function() { this.sta(this.zero_page()); this.cycles += 3; },
	  0x95 : function() { this.sta(this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0x8D : function() { this.sta(this.absolute()); this.cycles += 4; },
	  0x9D : function() { this.sta(this.absolute_indexed_with_x()); this.cycles += 5; },
	  0x99 : function() { this.sta(this.absolute_indexed_with_y()); this.cycles += 5; },
	  0x81 : function() { this.sta(this.indexed_x_indirect()); this.cycles += 6; },
	  0x91 : function() { this.sta(this.indirect_indexed_y()); this.cycles += 6; },
	  0xE8 : function() { this.inc_dec_register("XR", 1); this.cycles += 2; },
	  0xC8 : function() { this.inc_dec_register("YR", 1); this.cycles += 2; },
	  0xCA : function() { this.inc_dec_register("XR", -1); this.cycles += 2; },
	  0x88 : function() { this.inc_dec_register("YR", -1); this.cycles += 2; },
	  0xE6 : function() { this.inc_dec_memory(this.zero_page(), 1); this.cycles += 5; },
	  0xF6 : function() { this.inc_dec_memory(this.zero_page_indexed_with_x(), 1); this.cycles += 6; },
	  0xEE : function() { this.inc_dec_memory(this.absolute(), 1); this.cycles += 6; },
	  0xFE : function() { this.inc_dec_memory(this.absolute_indexed_with_x(), 1); this.cycles += 7; },
	  0xC6 : function() { this.inc_dec_memory(this.zero_page(), -1); this.cycles += 5; },
	  0xD6 : function() { this.inc_dec_memory(this.zero_page_indexed_with_x(), -1); this.cycles += 6;},
	  0xCE : function() { this.inc_dec_memory(this.absolute(), -1); this.cycles += 6; },
	  0xDE : function() { this.inc_dec_memory(this.absolute_indexed_with_x(), -1); this.cycles += 7; },
	  0x38 : function() { this.set_flag("C"); this.cycles += 2; },
	  0xF8 : function() { this.set_flag("D"); this.cycles += 2; },
	  0x78 : function() { this.set_flag("I"); this.cycles += 2; },
	  0x18 : function() { this.clear_flag("C"); this.cycles += 2; },
	  0xD8 : function() { this.clear_flag("D"); this.cycles += 2; },
	  0x58 : function() { this.clear_flag("I"); this.cycles += 2; },
	  0xB8 : function() { this.clear_flag("V"); this.cycles += 2; },
	  0xAA : function() { this.transfer_register("AC", "XR"); },
	  0x8A : function() { this.transfer_register("XR", "AC"); },
	  0xA8 : function() { this.transfer_register("AC", "YR"); },
	  0x98 : function() { this.transfer_register("YR", "AC"); },
	  0xBA : function() { this.transfer_register("SP", "XR"); },
	  0x9A : function() { this.transfer_register("XR", "SP"); },
	  0x48 : function() { this.push(this.AC); this.update_zero_and_neg_flags(this.AC); this.cycles += 3; },
	  0x08 : function() { this.push(this.SR); this.update_zero_and_neg_flags(this.SR); this.cycles += 3; },
	  0x68 : function() { this.pop("AC"); this.update_zero_and_neg_flags(this.AC); this.cycles += 4; },
	  0x28 : function() { this.pop("SR"); this.update_zero_and_neg_flags(this.SR); this.cycles += 4; }, // TODO: there's no need to call update_zero_and_neg_flags here, right?
	  0x29 : function() { this.logic_op("AND", this.immediate()); this.cycles += 2; },
	  0x25 : function() { this.logic_op("AND", this.zero_page()); this.cycles += 3; },
	  0x35 : function() { this.logic_op("AND", this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0x2D : function() { this.logic_op("AND", this.absolute()); this.cycles += 4; },
	  0x3D : function() { this.logic_op("AND", this.absolute_indexed_with_x()); this.cycles += 4; },
	  0x39 : function() { this.logic_op("AND", this.absolute_indexed_with_y()); this.cycles += 4; },
	  0x21 : function() { this.logic_op("AND", this.indexed_x_indirect()); this.cycles += 6; },
	  0x31 : function() { this.logic_op("AND", this.indirect_indexed_y()); this.cycles += 5; },
	  0x09 : function() { this.logic_op("ORA", this.immediate()); this.cycles += 2; },
	  0x05 : function() { this.logic_op("ORA", this.zero_page()); this.cycles += 3; },
	  0x15 : function() { this.logic_op("ORA", this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0x0D : function() { this.logic_op("ORA", this.absolute()); this.cycles += 4; },
	  0x1D : function() { this.logic_op("ORA", this.absolute_indexed_with_x()); this.cycles += 4; },
	  0x19 : function() { this.logic_op("ORA", this.absolute_indexed_with_y()); this.cycles += 4; },
	  0x01 : function() { this.logic_op("ORA", this.indexed_x_indirect()); this.cycles += 6; },
	  0x11 : function() { this.logic_op("ORA", this.indirect_indexed_y()); this.cycles += 5; },
	  0x49 : function() { this.logic_op("EOR", this.immediate()); this.cycles += 2; },
	  0x45 : function() { this.logic_op("EOR", this.zero_page()); this.cycles += 3; },
	  0x55 : function() { this.logic_op("EOR", this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0x4D : function() { this.logic_op("EOR", this.absolute()); this.cycles += 4; },
	  0x5D : function() { this.logic_op("EOR", this.absolute_indexed_with_x()); this.cycles += 4; },
	  0x59 : function() { this.logic_op("EOR", this.absolute_indexed_with_y()); this.cycles += 4; },
	  0x41 : function() { this.logic_op("EOR", this.indexed_x_indirect()); this.cycles += 6; },
	  0x51 : function() { this.logic_op("EOR", this.indirect_indexed_y()); this.cycles += 5; },
	  0x4C : function() { this.jump(this.absolute()); this.cycles += 3; },
	  0x6C : function() { this.jump(this.absolute_indirect()); this.cycles += 5; },
	  0x20 : function() { this.push_word(this.PC + 1); this.jump(this.absolute()); this.cycles += 6; },
	  0x60 : function() { this.rts(this.immediate()); this.cycles += 6; },
	  0x40 : function() { this.rti(); this.cycles += 6; },
	  0x90 : function() { this.branch_flag_clear("C"); },
	  0xB0 : function() { this.branch_flag_set("C"); },
	  0xF0 : function() { this.branch_flag_set("Z"); },
	  0xD0 : function() { this.branch_flag_clear("Z"); },
	  0x10 : function() { this.branch_flag_clear("N"); },
	  0x30 : function() { this.branch_flag_set("N"); },
	  0x50 : function() { this.branch_flag_clear("V"); },
	  0x70 : function() { this.branch_flag_set("V"); },
	  0x2A : function() { this.rotate("left"); this.cycles += 2; },
	  0x26 : function() { this.rotate("left", this.zero_page()); this.cycles += 5; },
	  0x36 : function() { this.rotate("left", this.zero_page_indexed_with_x()); this.cycles += 6; },
	  0x2E : function() { this.rotate("left", this.absolute()); this.cycles += 6; },
	  0x3E : function() { this.rotate("left", this.absolute_indexed_with_x()); this.cycles += 7; },
	  0x6A : function() { this.rotate("right"); this.cycles += 2; },
	  0x66 : function() { this.rotate("right", this.zero_page()); this.cycles += 5; },
	  0x76 : function() { this.rotate("right", this.zero_page_indexed_with_x()); this.cycles += 6; },
	  0x6E : function() { this.rotate("right", this.absolute()); this.cycles += 6; },
	  0x7E : function() { this.rotate("right", this.absolute_indexed_with_x()); this.cycles += 7; },
	  0x4A : function() { this.shift("right"); this.cycles += 2; },
	  0x46 : function() { this.shift("right", this.zero_page()); this.cycles += 5; },
	  0x56 : function() { this.shift("right", this.zero_page_indexed_with_x()); this.cycles += 6; },
	  0x4E : function() { this.shift("right", this.absolute()); this.cycles += 6; },
	  0x5E : function() { this.shift("right", this.absolute_indexed_with_x()); this.cycles += 7; },
	  0x0A : function() { this.shift("left"); this.cycles += 2; },
	  0x06 : function() { this.shift("left", this.zero_page()); this.cycles += 5; },
	  0x16 : function() { this.shift("left", this.zero_page_indexed_with_x()); this.cycles += 6; },
	  0x0E : function() { this.shift("left", this.absolute()); this.cycles += 6; },
	  0x1E : function() { this.shift("left", this.absolute_indexed_with_x()); this.cycles += 7; },
	  0xC9 : function() { this.compare("AC", this.immediate()); this.cycles += 2; },
	  0xC5 : function() { this.compare("AC", this.zero_page()); this.cycles += 3; },
	  0xD5 : function() { this.compare("AC", this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0xCD : function() { this.compare("AC", this.absolute()); this.cycles += 4; },
	  0xDD : function() { this.compare("AC", this.absolute_indexed_with_x()); this.cycles += 4; },//FIXME Page boundaries
	  0xD9 : function() { this.compare("AC", this.absolute_indexed_with_y()); this.cycles += 4; },//FIXME Page boundaries
	  0xC1 : function() { this.compare("AC", this.indexed_x_indirect()); this.cycles += 6; },
	  0xD1 : function() { this.compare("AC", this.indirect_indexed_y()); this.cycles += 5; },
	  0xE0 : function() { this.compare("XR", this.immediate()); this.cycles += 2; },
	  0xE4 : function() { this.compare("XR", this.zero_page()); this.cycles += 3; },
	  0xEC : function() { this.compare("XR", this.absolute()); this.cycles += 4; },
	  0xC0 : function() { this.compare("YR", this.immediate()); this.cycles += 2; },
	  0xC4 : function() { this.compare("YR", this.zero_page()); this.cycles += 3; },
	  0xCC : function() { this.compare("YR", this.absolute()); this.cycles += 4; },
	  0x24 : function() { this.bit(this.zero_page()); this.cycles += 3; },
	  0x2C : function() { this.bit(this.absolute()); this.cycles += 4; },
	  0x69 : function() { this.adc(this.immediate()); this.cycles += 2; },
	  0x65 : function() { this.adc(this.zero_page()); this.cycles += 3; },
	  0x75 : function() { this.adc(this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0x6D : function() { this.adc(this.absolute()); this.cycles += 4; },
	  0x7D : function() { this.adc(this.absolute_indexed_with_x()); this.cycles += 4; },
	  0x79 : function() { this.adc(this.absolute_indexed_with_y()); this.cycles += 4; },
	  0x61 : function() { this.adc(this.indexed_x_indirect()); this.cycles += 6; },
	  0x71 : function() { this.adc(this.indirect_indexed_y()); this.cycles += 5; },
	  0xE9 : function() { this.sbc(this.immediate()); this.cycles += 2; },
	  0xE5 : function() { this.sbc(this.zero_page()); this.cycles += 3; },
	  0xF5 : function() { this.sbc(this.zero_page_indexed_with_x()); this.cycles += 4; },
	  0xED : function() { this.sbc(this.absolute()); this.cycles += 4; },
	  0xFD : function() { this.sbc(this.absolute_indexed_with_x()); this.cycles += 4; },
	  0xF9 : function() { this.sbc(this.absolute_indexed_with_y()); this.cycles += 4; },
	  0xE1 : function() { this.sbc(this.indexed_x_indirect()); this.cycles += 6; },
	  0xF1 : function() { this.sbc(this.indirect_indexed_y()); this.cycles += 5; },
	  0xEA : function() { },
	  0x00 : function() { this.brk(); }
	};
};

CPU6502.prototype.run = function(opcode) {
	var op = this.opcodes[opcode];
  if (typeof op === "undefined") {
    throw new Error("Found undefined opcode 0x" + formatHex(opcode, 2) +
      " at 0x" + formatHex(this.PC, 4));
  } else {
    return op.call(this);
  }
}

CPU6502.prototype.immediate = function() {
  return this.PC++;
};
//implied addressing mode function unnecessary
CPU6502.prototype.accumulator = function() {
  return this.AC;
};
CPU6502.prototype.relative = function() {
  var jump = unsigned_to_signed(this._read_memory(this.PC++));
  return this.PC + jump;
};
CPU6502.prototype.zero_page = function() {
  if (this._read_memory(this.PC) > 0xFF) throw new Error("Zero_Page boundary exceeded");
  return this._read_memory(this.PC++);
};
CPU6502.prototype.zero_page_indexed_with_x = function() {
  var addr = this._read_memory(this.PC++) + this.XR;
  if (addr > 0xFF) throw new Error("Zero_Page boundary exceeded");
  return addr;
};
CPU6502.prototype.zero_page_indexed_with_y = function() {
  var addr = this._read_memory(this.PC++) + this.YR;
  if (addr > 0xFF) throw new Error("Zero_Page boundary exceeded");
  return addr;
};
CPU6502.prototype.absolute = function() {
  var addr = this.read_word(this.PC);
  this.PC += 2;
  return addr;
};
CPU6502.prototype.absolute_indexed_with_x = function() {
  var addr = this.read_word(this.PC) + this.XR;
  this.PC += 2;
  return addr;
};
CPU6502.prototype.absolute_indexed_with_y = function() {
  var addr = this.read_word(this.PC) + this.YR;
  this.PC += 2;
  return addr;
};
CPU6502.prototype.absolute_indirect = function() {
  var addr = this.read_word(this.PC);
  if (this.COMPATIBILITY_MODE && (addr & 0x00FF) === 0x00FF){
    addr = this._read_memory(addr) + (this._read_memory(addr & 0xFF00) << 8);
  } else {
    addr = this.read_word(addr);
  }
  this.PC += 2;
  return addr;
};
CPU6502.prototype.indexed_x_indirect = function() {
  var addr = this._read_memory(this.PC++);

  addr = (addr + this.XR) & 0xFF;
  return this.read_word(addr);
};
CPU6502.prototype.indirect_indexed_y = function() {
  var addr = this._read_memory(this.PC++),
      low = this._read_memory(addr) + this.YR,
      high = this._read_memory(addr + 1);

  if ((low & 0xFF) != low) { // Handle carry from adding YR
    low &= 0xFF;
    high += 1;
    // TODO: this takes another cycle and generates a read
  }

  return (high << 8) + low;
};

//This can be used for soft switches, memory visualization, etc.
//Called on both read and writes.
CPU6502.prototype.add_memory_callback = function(caller, callback) {
	this.memory_callbacks.push( {caller: caller, callback: callback} )
}

CPU6502.prototype.call_all_memory_callbacks = function(location, value) {
	var result = undefined;
	for (var i = 0; i < this.memory_callbacks.length; i++) {
		var obj = this.memory_callbacks[i];
		result = obj.callback.call(obj.caller, location, value);
	}
	return result;
}

CPU6502.prototype._read_memory = function(loc) {
  var soft_switch_data =  this.call_all_memory_callbacks(loc);
  return soft_switch_data !== undefined ? soft_switch_data : this.memory[loc];
};

CPU6502.prototype.write_memory = function(loc, val) {
  if (typeof loc === "string") loc = parseInt(loc, 16);
  if (typeof val === "string") val = parseInt(val, 16);

  if (this.call_all_memory_callbacks(loc, val) !== undefined) {
    return;
  }

  if (val < 0) {
    throw new Error("ERROR: AT 0x"+this.PC.toString(16).toUpperCase()+" Tried to write a negative number ("+val.toString(16).toUpperCase()+"h) to memory (0x"+loc.toString(16).toUpperCase()+")");
  } else if (val <= 255 ) {
    this.memory[loc] = val;
  } else {
    console.log(val);
    throw new Error("ERROR: Tried to write more than a word!");
  }
};

// Internally, data in memory is numbers, not strings.
CPU6502.prototype._write_memory = function(loc, val) {
  if (typeof loc === "string") {
    loc = parseInt(loc, 16);
  }

  if (this.call_all_memory_callbacks(loc, val) !== undefined) {
    return;
  }

  if (val < 0) {
    throw new Error("ERROR: AT 0x"+this.PC.toString(16).toUpperCase()+" Tried to write a negative number ("+val.toString(16).toUpperCase()+"h) to memory (0x"+loc.toString(16).toUpperCase()+")");
  } else if (val <= 255 ) {
    this.memory[loc] = val;
  } else if (val <= 65535) {
    var high_byte = (val & 0xFF00) >> 8,
        low_byte = val & 0x00FF;
    this.memory[loc] = low_byte;
    this.memory[loc+1] = high_byte;
  } else {
    throw new Error("ERROR: Tried to write more than a word!");
  }
};

CPU6502.prototype.read_word = function(addr) {
 return this._read_memory(addr) + (this._read_memory(addr + 1) << 8);
};

CPU6502.prototype.set_register = function(register, val) {
  if (typeof val === "string") val = parseInt(val, 16);
  return this[register] = val;
};

CPU6502.prototype.get_status_flags = function() {
  var bits = zero_pad(this.SR, 8, 2).split('');
  bits = bits.map(function(item) {
    return parseInt(item, 10);
  });
  return {
    N: bits[0],
    V: bits[1],
    _: bits[2],
    B: bits[3],
    D: bits[4],
    I: bits[5],
    Z: bits[6],
    C: bits[7]
  };
};

CPU6502.prototype.set_status_flags = function(obj) {
  for (var bit in obj) {
    if (obj[bit]) {
      this.SR = this.SR | this.SR_FLAGS[bit];
    }
  };
};

CPU6502.prototype._ld_register = function(register, addr) {
  // Reset Zero and Negative Flags
  this.SR &= (255 - this.SR_FLAGS["Z"] - this.SR_FLAGS["N"]);

  this[register] = this._read_memory(addr);

  this.update_zero_and_neg_flags(this[register]);
};

CPU6502.prototype.update_zero_and_neg_flags = function(val) {
  this.SR |= (val & this.SR_FLAGS.N); // Set negative flag
  if (val & this.SR_FLAGS.N) {
    this.SR |= this.SR_FLAGS.N;
  } else {
    this.SR &= ~this.SR_FLAGS.N & 0xFF;
  }

  if (val === 0) {
    this.SR |= this.SR_FLAGS.Z; //Set zero flag
  } else {
    this.SR &= ~this.SR_FLAGS.Z & 0xFF; //Clear zero flag
  }
};

CPU6502.prototype.ldy = function(addr) { this._ld_register("YR", addr); };
CPU6502.prototype.ldx = function(addr) { this._ld_register("XR", addr); };
CPU6502.prototype.lda = function(addr) { this._ld_register("AC", addr); };
CPU6502.prototype.stx = function(addr) {
  this._write_memory(addr, this.XR);
};
CPU6502.prototype.sty = function(addr) {
  this._write_memory(addr, this.YR);
};
CPU6502.prototype.sta = function(addr) {
  this._write_memory(addr, this.AC);
};
CPU6502.prototype.adc = function(addr) {
  var val = this._read_memory(addr);

  var sr = this.SR & ~(this.SR_FLAGS.N | this.SR_FLAGS.V |
    this.SR_FLAGS.Z | this.SR_FLAGS.C);
  if (this.SR & this.SR_FLAGS.D) {
    var c = this.SR & this.SR_FLAGS.C;
    var al = (this.AC & 0xf) + (val & 0xf) + c;
    var ah = (this.AC & 0xf0) + (val & 0xf0);
    if (al > 9) {
      al += 6;
      ah += 0x10;
    }
    if (((this.AC + val + c) & 0xFF) === 0) {
      sr |= this.SR_FLAGS.Z;
    }
    if (ah & 0x80) {
      sr |= this.SR_FLAGS.N;
    }
    if (~(this.AC ^ val) & (this.AC ^ ah) & 0x80) {
      sr |= this.SR_FLAGS.V;
    }
    if (ah > 0x90) {
      ah += 0x60;
    }
    var sum = ah | (al & 0xf);
  } else {
    var sum = this.AC + val + (this.SR & this.SR_FLAGS.C);
    var sr = this.SR & ~(this.SR_FLAGS.N | this.SR_FLAGS.V |
      this.SR_FLAGS.Z | this.SR_FLAGS.C);
    if ((sum & 0xFF) === 0) {
      sr |= this.SR_FLAGS.Z;
    }
    if (sum & 0x80) {
      sr |= this.SR_FLAGS.N;
    }
    if (~(this.AC ^ val) & (this.AC ^ sum) & 0x80) {
      sr |= this.SR_FLAGS.V;
    }
  }
  if (sum > 0xFF) {
    sr |= this.SR_FLAGS.C;
  }
  this.AC = sum & 0xFF;
  this.SR = sr;
}
CPU6502.prototype.sbc = function(addr) {
  var val = this._read_memory(addr) ^ 0xff;

  var sr = this.SR & ~(this.SR_FLAGS.N | this.SR_FLAGS.V |
    this.SR_FLAGS.Z | this.SR_FLAGS.C);
  if (this.SR & this.SR_FLAGS.D) {
    var c = this.SR & this.SR_FLAGS.C;
    var al = (this.AC & 0xf) + (val & 0xf) + c;
    var ah = (this.AC & 0xf0) + (val & 0xf0);
    if (al < 0x10) {
      al -= 6;
    }
    if (((this.AC + val + c) & 0xFF) === 0) {
      sr |= this.SR_FLAGS.Z;
    }
    if (ah & 0x80) {
      sr |= this.SR_FLAGS.N;
    }
    if (~(this.AC ^ val) & (this.AC ^ ah) & 0x80) {
      sr |= this.SR_FLAGS.V;
    }
    if (ah < 0x100) {
      ah = (ah - 0x60) & 0xff;
    }
    var sum = ah | (al & 0xf);
  } else {
    var sum = this.AC + val + (this.SR & this.SR_FLAGS.C);
    var sr = this.SR & ~(this.SR_FLAGS.N | this.SR_FLAGS.V |
      this.SR_FLAGS.Z | this.SR_FLAGS.C);
    if ((sum & 0xFF) === 0) {
      sr |= this.SR_FLAGS.Z;
    }
    if (sum & 0x80) {
      sr |= this.SR_FLAGS.N;
    }
    if (~(this.AC ^ val) & (this.AC ^ sum) & 0x80) {
      sr |= this.SR_FLAGS.V;
    }
  }
  if (sum > 0xFF) {
    sr |= this.SR_FLAGS.C;
  }
  this.AC = sum & 0xFF;
  this.SR = sr;
}

/* Only to be used with 8-bit registers (i.e., anything but the PC) */
CPU6502.prototype.inc_dec_register = function(register, val) {
  this[register] += val;
  this[register] &= 0xFF;
  this.update_zero_and_neg_flags(this[register]);
};
CPU6502.prototype.inc_dec_memory = function(addr, val) {
  var result = (this._read_memory(addr) + val) & 0xFF;
  this._write_memory(addr, result);
  this.update_zero_and_neg_flags(result);
};
CPU6502.prototype.set_flag = function(flag) {
  this.SR |= this.SR_FLAGS[flag];
};
CPU6502.prototype.clear_flag = function(flag) {
  this.SR &= ~this.SR_FLAGS[flag] & 0xFF;
};
CPU6502.prototype.push = function(val) {
  var addr = (0x0100 + this.SP);
  this._write_memory(addr, val);

  if (this.SP <= 0x00) {
    this.SP = 0xFF;
  } else {
    this.SP--;
  }
};
CPU6502.prototype.pop = function(register) {
  this.SP++;
  var addr = (0x0100 + this.SP),
      val = this._read_memory(addr);
  if (register !== undefined) this[register] = val;

  if (addr >= 0x01FF) {
    this.SP = 0xFF;
  }
  return val;
};
CPU6502.prototype.push_word = function(val) {
  var low_byte = val & 0x00FF,
      high_byte = (val & 0xFF00) >> 8;
  this.push(high_byte);
  this.push(low_byte);
};
CPU6502.prototype.pop_word = function() {
  var low_byte = this.pop(),
      high_byte = (this.pop() << 8);

  return low_byte | high_byte;
};

CPU6502.prototype.transfer_register = function(from, to) {
  this[to] = this[from];
  this.cycles += 2;
  this.update_zero_and_neg_flags(this[to]);
};
CPU6502.prototype.logic_op = function(oper, addr) {
  switch (oper) { // TODO: I hate this. I want to pass operators as functions!
    case "AND":
      this.AC = this.AC & this._read_memory(addr);
      break;
    case "ORA":
      this.AC = this.AC | this._read_memory(addr);
      break;
    case "EOR":
      this.AC = this.AC ^ this._read_memory(addr);
  }
  this.AC = this.AC & 0xFF;
  this.update_zero_and_neg_flags(this.AC);
};
CPU6502.prototype.jump = function(addr) {
  this.PC = addr;
};
CPU6502.prototype.rts = function() {
  this.PC = this.pop_word() + 1;
};
CPU6502.prototype.rti = function() {
  this.pop("SR" );
  this.PC = this.pop_word();
};
CPU6502.prototype.branch_flag_set = function(flag) {
  var addr = this.relative();
  if ((this.SR & this.SR_FLAGS[flag]) === this.SR_FLAGS[flag]) {
    this.PC = addr;
  }
};
CPU6502.prototype.branch_flag_clear = function(flag) {
  var addr = this.relative();
  if ((this.SR & this.SR_FLAGS[flag]) === 0) {
    this.PC = addr;
  }
};
CPU6502.prototype.brk = function() {
  //this.running = false;
  this.cycles += 7;

  this.SR |= this.SR_FLAGS.I;
  this.SR |= this.SR_FLAGS.B;

  this.push_word(this.PC + 1);
  this.push(this.SR);

  this.PC = this.read_word(0xFFFE);
};

CPU6502.prototype.compare = function(register, addr) {
  var val = this._read_memory(addr),
      diff = this[register] - val;

  if (diff >= 0) {
    this.SR |= this.SR_FLAGS.C;
  } else {
    this.SR &= (~this.SR_FLAGS.C) & 0xFF;
  }

  this.update_zero_and_neg_flags(diff);
};
CPU6502.prototype.bit = function(addr) {
  var val = this._read_memory(addr),
      conj = this.AC & val;
  this.update_zero_and_neg_flags(conj);

  this.SR &= (~this.SR_FLAGS.V) & 0xFF;
  this.SR |= val & this.SR_FLAGS.V;

  this.SR &= (~this.SR_FLAGS.N) & 0xFF;
  this.SR |= val & this.SR_FLAGS.N;
};

CPU6502.prototype.shift = function(dir, addr) {
  this._shift(dir, false, addr); // Don't wrap
};
CPU6502.prototype.rotate = function(dir, addr) {
  this._shift(dir, true, addr); // Wrap, i.e., rotate
};
CPU6502.prototype._shift = function(dir, wrap, addr) {
  var val,
      new_val,
      old_carry = this.SR & this.SR_FLAGS.C;
  if (addr !== undefined) {
    val = this._read_memory(addr);
  } else {
    val = this.AC;
  }

  this.SR &= (~this.SR_FLAGS.C) & 0xFF;
  if (dir.toLowerCase() === "left") {
    new_val = (val << 1) & 0xFF;
    this.SR |= (val & 128) >> 7; //Get bit 7 (carry)
    if (wrap) new_val |= old_carry;
  } else if (dir.toLowerCase() === "right") {
    new_val = val >> 1;
    this.SR |= val & this.SR_FLAGS.C;
    if (wrap) new_val |= old_carry << 7;
  } else {
    throw new Error("Invalid shift direction");
  }

  if (addr !== undefined) {
    this.write_memory(addr, new_val);
  } else {
    this.AC = new_val;
  }
  this.update_zero_and_neg_flags(new_val);
};

CPU6502.prototype.mem_range = function(start, end) {
  var temp_mem = this.memory.slice(start, end);
  for (var i in temp_mem) temp_mem[i] = temp_mem[i].toString(16);
  return temp_mem;
};

CPU6502.prototype.run_step = function(update_function, caller) {

	if (typeof update_function === "undefined") {
  	update_function = function() {};
  }

  this.running = true;

  this.run(this._read_memory(this.PC++));
	update_function.call(caller);
  this.running = false;
};

CPU6502.prototype.run_loop = function(update_function, caller) {
  this.running = true;

  if (typeof update_function === "undefined") {
  	update_function = function() {};
  }

  var self = this;
  this.loop_id = setInterval(function() {
    var cycles = self.cycles;
    while (self.cycles < cycles + 10000) {
      self.run(self._read_memory(self.PC++));
    }

    update_function.call(caller);

    if (!self.running) {
      clearInterval(self.loop_id);
    }
  },20);
};

CPU6502.prototype.stop = function() {
	this.running = false;
	clearInterval(this.loop_id);
}

CPU6502.prototype.stack = function() {
	var stack_top = 0x01FF;
  var mem = [];

  for (var i = 0x0100 + this.SP + 1; i <= stack_top; i++) {
    mem.push({
                address : i,
                word : parseInt(this.memory[i], 16)
              });
  }

  return mem;
}

// Utilities
function zero_pad(n, len, base) {
  len = len || 2;
  base = base || 16;
  var result = n.toString(base).toUpperCase();
  while (result.length < len) {
    result = "0" + result;
  }
  return result;
}

function unsigned_to_signed(val) {
  if (val > 255) throw new Error("unsigned_to_signed only works on 1 byte numbers");
  if (val < 128) return val;
  return (val - 256);
}

function from_bcd(val) {
  var high = (val & 0xF0) >> 4,
      low = val & 0x0F;
  return high * 10 + low;
}

function to_bcd(val) {
  if (val > 99 || val < 0) throw new Error("Bad BCD Value");
  val = val.toString();
  if (val.length === 1) val = "0" + val;
  var digits = val.split("");

  return (parseInt(digits[0],10)<<4) + parseInt(digits[1],10);
}

function formatHex(number, len) {
  if (typeof number === "undefined" || number === null || isNaN(number)) {
    throw new Error("Invalid value \"" + number + "\" passed to formatHex()");
  }

  var str = number.toString(16).toUpperCase();

  if (!len) {
    if (str.length % 2 == 1) {
      len = str.length+1;
    }
  }

  while (str.length < len) {
    str = "0" + str;
  }

  return str;
}


