import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Image, FileImage } from "lucide-react";

export function DownloadLogo() {
  const [isOpen, setIsOpen] = useState(false);

  const downloadFile = (filename: string, displayName: string) => {
    const link = document.createElement('a');
    link.href = `/downloads/${filename}`;
    link.download = filename;
    link.click();
  };

  const logoVariants = [
    {
      name: "Основной логотип",
      filename: "dela-logo.svg",
      description: "Круглый логотип высокого разрешения (240x240px)",
      preview: "/downloads/dela-logo.svg"
    },
    {
      name: "Горизонтальный логотип",
      filename: "dela-logo-horizontal.svg", 
      description: "Логотип с текстом и подзаголовком (400x140px)",
      preview: "/downloads/dela-logo-horizontal.svg"
    },
    {
      name: "Иконка",
      filename: "dela-icon.svg",
      description: "Компактная иконка для приложений (64x64px)",
      preview: "/downloads/dela-icon.svg"
    },
    {
      name: "Фавикон",
      filename: "favicon.ico",
      description: "Иконка для браузера (32x32px)",
      preview: "/favicon.ico"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Скачать логотип
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Скачать логотип dela.</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {logoVariants.map((variant) => (
            <Card key={variant.filename} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{variant.name}</CardTitle>
                  <FileImage className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Превью */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-center h-24">
                  <img 
                    src={variant.preview} 
                    alt={variant.name}
                    className="max-h-16 max-w-16 object-contain"
                  />
                </div>
                
                {/* Описание */}
                <p className="text-sm text-muted-foreground">
                  {variant.description}
                </p>
                
                {/* Кнопка скачивания */}
                <Button 
                  onClick={() => downloadFile(variant.filename, variant.name)}
                  className="w-full gap-2"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  Скачать SVG
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Дополнительная информация */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="font-medium mb-2">Информация о файлах:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Все логотипы в векторном формате SVG</li>
            <li>• Высокое качество для печати и веб</li>
            <li>• Градиентные цвета: #3B82F6, #8B5CF6, #06B6D4</li>
            <li>• Свободно масштабируемые без потери качества</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}