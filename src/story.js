export const story = {
  prolog: {
    label: 'PROLOG', title: 'Külün İçindeki İsim', place: 'MİRRA VADİSİ · ESKİ YOL',
    tasks: ['Yolun kıyısındaki külü incele.', 'Liora ile konuş.', 'Akademi yoluna ilerle.'],
    objects: [
      { x: 520, label: 'KÜL YIĞINI', symbol: '✦', title: 'Soğumuş bir ocak', text: 'Küllerin arasında yarısı yanmış bir defter yaprağı duruyordu. Sorin, henüz adı konmamış bir büyünün izini parmaklarında hissetti.', button: 'Yaprağı al' },
      { x: 1000, label: 'LIORA', symbol: '◇', title: 'Bir çocukluk sözü', text: 'Liora: “Bir gün bu vadiden gideceğim, Sorin. Ama gökyüzü nereye gidersem gideyim aynı kalacak.”', choices: [{ text: '“Ben seni beklerim.”', value: 'beklerim', reply: 'Liora gülümsedi. Bazı sözler, söylendikleri anda bile bir veda gibidir.' }, { text: '“Kendi yolunu bul.”', value: 'yol', reply: 'Liora başını eğdi. Sorin, cesaretin bazen bırakmak olduğunu henüz bilmiyordu.' }] },
      { x: 1490, label: 'AKADEMİ YOLU', symbol: '➜', title: 'Vadinin son ışığı', text: 'Noctis Akademisi uzakta, dağın böğrüne saplanmış siyah bir iğne gibi yükseliyordu. Sorin cebindeki yaprağı sıktı.', button: 'Yola çık' }
    ]
  },
  bolum1: {
    label: 'BÖLÜM 01', title: 'Taşın Hafızası', place: 'NOCTIS AKADEMİSİ · KÜL KORİDORU',
    tasks: ['Koridordaki ay çiçeğini topla.', 'Defterinin yankısını dinle.', 'Genç öğrenciyle yüzleş.'],
    objects: [
      { x: 520, label: 'AY ÇİÇEĞİ', symbol: '✦', title: 'Taşın arasındaki hayat', text: 'Duvarın çatlağında solgun bir ay çiçeği büyüyordu. Sorin onu dikkatle topladı; en kırılgan şeyler bile karanlıkta yol bulabilirdi.', button: 'Çiçeği al' },
      { x: 1000, label: 'KÜL DEFTERİ', symbol: '◇', title: 'İlk icat', text: 'Defterin kenarında kendi el yazısı: “Kor Mührü — bir çember, bir kıvılcım. Her ateşin karşısında onu söndürecek bir su vardır.”', button: 'Hatırla' },
      { x: 1490, label: 'ÖĞRENCİ', symbol: '✧', title: 'Aynadaki yabancı', text: 'Genç öğrenci defterden çalınmış sayfayı kaldırdı. Parmaklarının ucunda Sorin’in Kor Mührü yandı.\n\nSorin: “Benim büyülerimi bana karşı mı kullanıyorsun?”', button: 'Düelloya gir' }
    ]
  }
};
