using DocumentFormat.OpenXml; using DocumentFormat.OpenXml.Packaging; using DocumentFormat.OpenXml.Validation;
int bad=0;
foreach(var f in args){
 try{ using var doc=PresentationDocument.Open(f,false);
  var v=new OpenXmlValidator(FileFormatVersions.Microsoft365); int n=0;
  foreach(var e in v.Validate(doc)){ n++; if(n<=15) Console.WriteLine($"  {e.ErrorType} {e.Part?.Uri} {e.Path?.XPath}: {e.Description}"); }
  Console.WriteLine($"{(n==0?"OK ":"ERR")} {n} {f}"); if(n>0)bad++;
 }catch(Exception ex){Console.WriteLine($"OPENFAIL {f}: {ex.GetType().Name} {ex.Message}");bad++;}
}
return bad>0?1:0;
