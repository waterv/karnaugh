class karnaugh {
    MaxLength = 4;
    MaxNumber = 16;                         // 2 ^ MaxLength
    chars = ["A", "B", "C", "D", "E", "F"]; // chars.length = MaxLength

    // Input:  二进制码 (String)
    // Output: 二进制码中 1 的数目 (Number)
    bitNum(bits) {
        let n = 0;
        for (let i = 0; i < bits.length; i ++) {
            if (bits[i] == "1") n += 1;
        }
        return n;
    }

    // Input:  十进制数 (Number)
    // Output: 二进制码 (String)
    binaryify(m) {
        let i = this.MaxNumber;
        let str = "";
        while (i >>= 1) {
            if (m & i) str += "1";
            else str += "0";
        }
        return str;
    }

    // Input:  二进制码 (String)
    // Output: 十进制数 (Number)
    decimalify(bits) {
        let n = this.MaxNumber;
        let i = 0;
        let ans = 0;
        while (n >>= 1) {
            if (bits[i] == 1)
                ans += n;
            i += 1;
        }
        return ans;
    }

    // Input:  含「-」二进制码 (String)
    // Output: 布尔单项式 TeX 公式 (String)
    termify(bits) {
        let index = 0;
        let str = "";
        for (let i = 0; i < bits.length; i ++) {
            if (bits[i] == "0") str += "\\bar ";
            if (bits[i] != "-") str += this.chars[index];
            index += 1;
        }
        return str.length ? str : "1";
    }
    termify_POS(bits) {
        let index = 0;
        let str = "";
        for (let i = 0; i < bits.length; i ++) {
            if (str.length && bits[i] != "-") str += "+";
            if (bits[i] == "1") str += "\\bar ";
            if (bits[i] != "-") str += this.chars[index];
            index += 1;
        }
        return str.length ? `(${str})` : "0";
    }

    // Input:  含「-」二进制码 (String)
    // Output: 二进制码中所含所有最小项的十进制数组 (Number[])
    minimumTermify(bits) {
        if (bits.length == 0) return [];
        let terms = [""];
        let termsTemp = new Array();
        for (let i = 0; i < bits.length; i ++) {
            if (bits[i] == "-") terms.forEach(u => {
                termsTemp.push(u + "1");
                termsTemp.push(u + "0");
            });
            else terms.forEach(u => {
                termsTemp.push(u + bits[i]);
            });
            terms = termsTemp;
            termsTemp = new Array();
        }
        return terms.map(u => this.decimalify(u));
    }

    // 尝试合并 u 和 v，返回空串表示合并失败
    // Input:  含「-」二进制码 (String)
    // Return: 含「-」二进制码 (String)
    merge(u, v) {
        let flag = false;
        let str = "";
        for (let i = 0; i < u.length; i ++) {
            if (u[i] != v[i])
                if (flag) return false;
                else {
                    flag = true;
                    str += "-";
                }
            else str += u[i];
        }
        return str;
    }

    // 用 Quine-McCluskey 算法将若干最小项化简
    // Input:  十进制数组 (Number[])
    // Return: 含「-」二进制码数组 (String[])
    simplify(ones, dontcares) {
        let group = new Array();
        let groupTemp = new Array();
        for (let i = 0; i <= this.MaxLength; i ++) {
            group[i] = new Map();
            groupTemp[i] = new Map();
        }
        let result = new Set();
        ones.forEach(num => {
            let bits = this.binaryify(num);
            group[this.bitNum(bits)].set(bits, false);
        });
        dontcares.forEach(num => { // 无关项也参与合并, 但不参与后续素项表化简
            let bits = this.binaryify(num);
            group[this.bitNum(bits)].set(bits, false);
        });
        while (true) {
            let hasMerged = false;
            // 尝试合并相邻组的两项
            for (let i = 0; i < this.MaxLength; i ++)
                for (let u of group[i])
                    for (let v of group[i + 1]) {
                        let merged = this.merge(u[0], v[0]);
                        if (merged) {
                            hasMerged = true;
                            groupTemp[this.bitNum(merged)].set(merged, false);
                            group[i].set(u[0], true);
                            group[i + 1].set(v[0], true);
                        }
                    }
            // 将未被标记到的「素蕴涵项」加入结果列表
            for (let i = 0; i <= this.MaxLength; i ++)
                for (let u of group[i])
                    if (u[1] == false)
                        result.add(u[0]);
            // 如果未能成功合并，循环结束
            if (!hasMerged) break;

            group = groupTemp;
            groupTemp = new Array();
            for (let i = 0; i <= this.MaxLength; i ++)
                groupTemp[i] = new Map();
        }
        return Array.from(result);
    }

    // 使用素项表进一步化简
    simplify_prime(ones, dontcares) {
        let result = this.simplify(ones, dontcares);
        let simplifiedResult = new Array();

        let gcols = new Set(); // 列的集合, g for "global"
        let rowsOfCol = new Array();
        let colsOfRow = new Map();
        ones.forEach(col => {
            gcols.add(col);
            rowsOfCol[col] = new Array();
        });
        result.forEach(row => {
            let cols = this.minimumTermify(row);
            let reducedCols = new Array(); // 只在一行的最小项
            cols.forEach(col => {
                if (!dontcares.has(col)) { // 无关项不参与素项表化简
                    rowsOfCol[col].push(row);
                    reducedCols.push(col);
                }
            });
            if (reducedCols.length)
                colsOfRow.set(row, reducedCols);
        });

        // 初步确定素项
        rowsOfCol.forEach(row => {
            if (row.length == 1 && colsOfRow.get(row[0])) { // 素项
                simplifiedResult.push(row[0]); // 加入最终结果
                colsOfRow.get(row[0]).forEach(col => {
                    if (gcols.has(col)) {
                        gcols.delete(col);
                        rowsOfCol[col] = new Array(); // 删除该项所含所有最小项
                    }
                });
                colsOfRow.delete(row[0]);
            }
        });

        while (gcols.size > 0) {
            let max = 0;
            let rowOfMax = 0;
            // 寻找含有最小项最多的蕴含项
            colsOfRow.forEach((cols, row) => {
                let length = 0;
                cols.forEach(col => {
                    if (gcols.has(col))
                        length += 1;
                });
                if (length > max) {
                    max = length;
                    rowOfMax = row;
                }
            });
            if (max == 0) break;
            simplifiedResult.push(rowOfMax);
            colsOfRow.get(rowOfMax).forEach(col => {
                if (gcols.has(col)) {
                    gcols.delete(col);
                    rowsOfCol[col] = new Array();
                }
            });
            colsOfRow.delete(rowOfMax);
        }
        return simplifiedResult.length ? simplifiedResult : result;
    }
}