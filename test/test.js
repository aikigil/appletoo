var appleToo,
    setupTeardown = {
      setup: function() {
        appleToo = new AppleToo();
      },
      teardown: function() {
        appleToo = undefined;
      }
    };

module("Helper functions", setupTeardown);
test("get_register", function() {
  expect(1);
  appleToo.XR = 1;
  equal(appleToo.get_register("XR"), "01");
});
test("set_register", function() {
  expect(1);
  appleToo.set_register("XR", "01");
  equal(appleToo.XR, 1);
});
test("get_status_flags", function() {
  expect(1);
  deepEqual(appleToo.get_status_flags(), {N:0, V:0, _:0, B:0, D:0, I:0, Z:0, C:0});
});
test("set_status_flags", function() {
  expect(1);
  appleToo.set_status_flags({N:1, V:0, _:0, B:0, D:0, I:0, Z:1, C:0});
  equal(appleToo.SR, 130);
});

module("Load and Store", setupTeardown);
test("LDY_I", function() {
  expect(2);

  appleToo.run6502("A0 0F");
  equal(appleToo.get_register("YR"), "0F", "Argument should be loaded into Register Y");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
});

test("LDY_ZP", function() {
  expect(2);

  appleToo.write_memory("0F", "AA");

  appleToo.run6502("A4 0F");
  equal(appleToo.get_register("YR"), "AA", "Value from Zero Page Memory should be loaded into Register Y");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("LDY_ZPX", function() {
  expect(2);

  appleToo.set_register("XR", "01");
  appleToo.write_memory("03", "0F");

  appleToo.run6502("B4 02");
  equal(appleToo.get_register("YR"), "0F", "Value at Memory location (Zero Page Arg + value in Register X) should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("LDY_A", function() {
  expect(2);

  appleToo.write_memory("ABCD", "AA");
  appleToo.run6502("AC AB CD");
  equal(appleToo.get_register("YR"), "AA", "Value at 2-byte argument should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
})

test("LDY_AX", function() {
  expect(2);

  appleToo.write_memory("AABB", "AA");
  appleToo.set_register("XR", "BB");
  appleToo.run6502("BC AA 00");
  equal(appleToo.get_register("YR"), "AA", "Value at memory location (absolute arg + value at Register X) should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
});

test("LDX_I", function() {
  expect(2);

  appleToo.run6502("A2 FF");
  equal(appleToo.get_register("XR"), "FF", "Argument should be loaded into Register X");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
});

test("LDX_ZP", function() {
  expect(2);

  appleToo.write_memory("0F", "AA");

  appleToo.run6502("A6 0F");
  equal(appleToo.get_register("XR"), "AA", "Value from Zero Page Memory should be loaded into Register X");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("LDX_ZPY", function() {
  expect(2);

  appleToo.set_register("YR", "01");
  appleToo.write_memory("03", "0F");

  appleToo.run6502("B6 02");
  equal(appleToo.get_register("XR"), "0F", "Value at Memory location (Zero Page Arg + value in Register Y) should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("LDX_A", function() {
  expect(2);

  appleToo.write_memory("ABCD", "AA");
  appleToo.run6502("AE AB CD");
  equal(appleToo.get_register("XR"), "AA", "Value at 2-byte argument should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
})

test("LDX_AY", function() {
  expect(2);

  appleToo.write_memory("AABB", "AA");
  appleToo.set_register("YR", "BB");
  appleToo.run6502("BE AA 00");
  equal(appleToo.get_register("XR"), "AA", "Value at memory location (absolute arg + value at Register Y) should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
});

test("LDA_I", function() {
  expect(2);

  appleToo.run6502("A9 FF");
  equal(appleToo.get_register("AC"), "FF", "Argument should be loaded into Accumulator");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
});

test("LDA_ZP", function() {
  expect(2);

  appleToo.write_memory("0F", "AA");

  appleToo.run6502("A5 0F");
  equal(appleToo.get_register("AC"), "AA", "Value from Zero Page Memory should be loaded into Accumulator");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("LDA_ZPX", function() {
  expect(2);

  appleToo.set_register("XR", "01");
  appleToo.write_memory("03", "0F");

  appleToo.run6502("B5 02");
  equal(appleToo.get_register("AC"), "0F", "Value at Memory location (Zero Page Arg + value in Register X) should be loaded into Accumulator");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("LDA_A", function() {
  expect(2);

  appleToo.write_memory("ABCD", "AA");
  appleToo.run6502("AD AB CD");
  equal(appleToo.get_register("AC"), "AA", "Value at 2-byte argument should be loaded into Accumulator");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
})

test("LDA_AX", function() {
  expect(2);

  appleToo.write_memory("AABB", "AA");
  appleToo.set_register("XR", "BB");
  appleToo.run6502("BD AA 00");
  equal(appleToo.get_register("AC"), "AA", "Value at memory location (absolute arg + value at Register X) should be loaded into Accumlator");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
});

test("LDA_AY", function() {
  expect(2);

  appleToo.write_memory("AABB", "AA");
  appleToo.set_register("YR", "BB");
  appleToo.run6502("B9 AA 00");
  equal(appleToo.get_register("AC"), "AA", "Value at memory location (absolute arg + value at Register Y) should be loaded into Accumlator");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
});

test("LDA_IDX", function() {
  expect(2);

  appleToo.write_memory("17", "10");
  appleToo.write_memory("18", "D0");
  appleToo.write_memory("D010", "AF");
  appleToo.set_register("XR", "02");
  appleToo.run6502("A1 15");
  equal(appleToo.get_register("AC"), "AF", "Load value into Accumlator using Zero Page Indexed Indirect addressing mode with X");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

test("LDA_IDY", function() {
  expect(2);

  appleToo.write_memory("17", "10");
  appleToo.write_memory("18", "D0");
  appleToo.write_memory("D010", "AF");
  appleToo.set_register("YR", "02");
  appleToo.run6502("B1 15");
  equal(appleToo.get_register("AC"), "AF", "Load value into Accumlator using Zero Page Indexed Indirect addressing mode with Y");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

test("STA_A", function() {
  expect(2);

  appleToo.set_register("AC", "AA");
  appleToo.run6502("8D 13 37");
  equal(appleToo.read_memory("1337"), "AA", "Store Accumlator at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STA_AX", function() {
  expected(2);

  appleToo.set_register("AC", "AA");
  appleToo.set_register("XR", "02");
  appleToo.run6502("9D 13 35");
  equal(appleToo.read_memory("1337"), "AA", "Store Accumlator at given absolute address + value in Register X");
  equal(appleToo.cycles, 5, "Should take 5 cycles");
});

test("STA_AY", function() {
  expected(2);

  appleToo.set_register("AC", "AA");
  appleToo.set_register("YR", "02");
  appleToo.run6502("99 13 35");
  equal(appleToo.read_memory("1337"), "AA", "Store Accumlator at given absolute address + value in Register Y");
  equal(appleToo.cycles, 5, "Should take 5 cycles");
});

test("STA_ZP", function() {
  expected(2);

  appleToo.set_register("AC", "AA");
  appleToo.run6502("85 01");

  equal(appleToo.read_memory("01"), "AA", "Store Accumlator at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STA_ZPX", function() {
  expected(2);

  appleToo.set_register("AC", "AA");
  appleToo.set_register("XR", "01");
  appleToo.run6502("95 01");

  equal(appleToo.read_memory("02"), "AA", "Store Accumlator at (Zero Page Memory Location + value in Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STA_IDX", function() {
  expect(2);

  appleToo.set_register("AC", "BB");
  appleToo.set_register("XR", "02");

  appleToo.write_memory("17", "10");
  appleToo.write_memory("18", "D0");
  appleToo.write_memory("D010", "AF");
  appleToo.run6502("81 15");

  equal(appleToo.read_memory("AF"), "BB", "Store Accumlator using Zero Page Indexed Indirect addressing mode with X");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

test("STA_IDY", function() {
  expect(2);

  appleToo.set_register("AC", "BB");
  appleToo.set_register("YR", "02");

  appleToo.write_memory("17", "10");
  appleToo.write_memory("18", "D0");
  appleToo.write_memory("D010", "AF");
  appleToo.run6502("91 15");

  equal(appleToo.read_memory("AF"), "BB", "Store Accumlator using Zero Page Indexed Indirect addressing mode with Y");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

test("STX_ZP", function() {
  expected(2);

  appleToo.set_register("XR", "AA");
  appleToo.run6502("86 01");

  equal(appleToo.read_memory("01"), "AA", "Store Register X at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STX_ZPY", function() {
  expected(2);

  appleToo.set_register("XR", "AA");
  appleToo.set_register("YR", "01");
  appleToo.run6502("96 01");

  equal(appleToo.read_memory("02"), "AA", "Store Register X at (Zero Page Memory Location + value in Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STX_A", function() {
  expect(2);

  appleToo.set_register("XR", "AA");
  appleToo.run6502("8E 13 37");
  equal(appleToo.read_memory("1337"), "AA", "Store Register X at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STY_ZP", function() {
  expected(2);

  appleToo.set_register("YR", "AA");
  appleToo.run6502("84 01");

  equal(appleToo.read_memory("01"), "AA", "Store Register Y at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STY_ZPX", function() {
  expected(2);

  appleToo.set_register("YR", "AA");
  appleToo.set_register("XR", "01");
  appleToo.run6502("94 01");

  equal(appleToo.read_memory("02"), "AA", "Store Register Y at (Zero Page Memory Location + value in Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STY_A", function() {
  expect(2);

  appleToo.set_register("YR", "AA");
  appleToo.run6502("8C 13 37");
  equal(appleToo.read_memory("1337"), "AA", "Store Register Y at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

module("Arithmetic", setupTeardown);



// vim: expandtab:ts=2:sw=2