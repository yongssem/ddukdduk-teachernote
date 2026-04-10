import * as XLSX from 'xlsx';
import { todayStr, getTagColor, TAG_PRESETS } from './store';

function formatRecordCell(records) {
  if (!records || records.length === 0) return '';
  return records
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => {
      const [, m, d] = r.date.split('-');
      const tag = r.tag ? `[${r.tag}] ` : '';
      return `[${parseInt(m)}/${parseInt(d)}] ${tag}${r.memo}`;
    })
    .join(' / ');
}

export function exportClassExcel(cls, tagSettings) {
  const wb = XLSX.utils.book_new();
  const rows = [['번호', '이름', '성별', '날짜', '태그', '메모']];

  for (const student of cls.students) {
    if (!student.records || student.records.length === 0) {
      rows.push([student.no, student.name, student.gender === 'M' ? '남' : '여', '', '', '']);
    } else {
      for (const rec of student.records.sort((a, b) => a.date.localeCompare(b.date))) {
        rows.push([student.no, student.name, student.gender === 'M' ? '남' : '여', rec.date, rec.tag || '', rec.memo || '']);
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 10 }, { wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, `${cls.grade}-${cls.classNum}`);

  XLSX.writeFile(wb, `뚝딱교담수첩_${cls.grade}-${cls.classNum}_${todayStr()}.xlsx`);
}

export function exportAllExcel(classes, tagSettings) {
  const wb = XLSX.utils.book_new();

  for (const cls of classes) {
    const rows = [['번호', '이름', '성별', '날짜', '태그', '메모']];
    for (const student of cls.students) {
      if (!student.records || student.records.length === 0) {
        rows.push([student.no, student.name, student.gender === 'M' ? '남' : '여', '', '', '']);
      } else {
        for (const rec of student.records.sort((a, b) => a.date.localeCompare(b.date))) {
          rows.push([student.no, student.name, student.gender === 'M' ? '남' : '여', rec.date, rec.tag || '', rec.memo || '']);
        }
      }
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 10 }, { wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, `${cls.grade}-${cls.classNum}`);
  }

  XLSX.writeFile(wb, `뚝딱교담수첩_전체_${todayStr()}.xlsx`);
}

export function exportSummaryExcel(classes, tagSettings) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = [['반', '번호', '이름', '성별', '기록 요약']];
  for (const cls of classes) {
    for (const student of cls.students) {
      summaryRows.push([
        `${cls.grade}-${cls.classNum}`,
        student.no,
        student.name,
        student.gender === 'M' ? '남' : '여',
        formatRecordCell(student.records),
      ]);
    }
  }
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [{ wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 6 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, '학생별 요약');

  // Statistics sheet
  const allTagNames = [];
  const presets = tagSettings?.presets || {};
  for (const [name, enabled] of Object.entries(presets)) {
    if (enabled) allTagNames.push(name);
  }
  for (const t of (tagSettings?.custom || [])) {
    allTagNames.push(t.name);
  }

  const statsRows = [['반', '번호', '이름', ...allTagNames, '태그없음', '합계']];
  for (const cls of classes) {
    for (const student of cls.students) {
      const counts = {};
      let noTagCount = 0;
      let total = 0;
      for (const name of allTagNames) counts[name] = 0;
      for (const rec of (student.records || [])) {
        total++;
        if (rec.tag && counts[rec.tag] !== undefined) {
          counts[rec.tag]++;
        } else if (!rec.tag) {
          noTagCount++;
        }
      }
      statsRows.push([
        `${cls.grade}-${cls.classNum}`,
        student.no,
        student.name,
        ...allTagNames.map(n => counts[n] || 0),
        noTagCount,
        total,
      ]);
    }
  }
  const statsWs = XLSX.utils.aoa_to_sheet(statsRows);
  statsWs['!cols'] = [{ wch: 8 }, { wch: 6 }, { wch: 10 }, ...allTagNames.map(() => ({ wch: 8 })), { wch: 8 }, { wch: 6 }];
  XLSX.utils.book_append_sheet(wb, statsWs, '통계');

  XLSX.writeFile(wb, `뚝딱교담수첩_요약_${todayStr()}.xlsx`);
}

export function parseStudentsFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const students = [];
        for (const row of data) {
          if (!row || row.length < 2) continue;
          const no = parseInt(row[0]);
          const name = String(row[1] || '').trim();
          if (isNaN(no) || !name) continue;
          const genderRaw = String(row[2] || '').trim();
          let gender = '';
          if (['남', 'M', 'm', '남자'].includes(genderRaw)) gender = 'M';
          else if (['여', 'F', 'f', '여자'].includes(genderRaw)) gender = 'F';
          students.push({ no, name, gender, records: [] });
        }
        resolve(students);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
